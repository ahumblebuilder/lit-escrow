import * as Sentry from '@sentry/node';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { type AppData, assertPermittedVersion } from '../jobVersion';
import { getUserPermittedVersion } from './utils';
import { getEVMTransactionSignerToolClient } from './vincentAbilities';
import { env } from '../../../env';
import { normalizeError } from '../../../error';
import { Settlement } from '../../../mongo/models/PurchasedCoin';

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  ethAddress: string;
  fromAddress: string;
  name: string;
  pkpInfo: IRelayPKP;
  toAddress: string;
  updatedAt: Date;
};

const { BASE_RPC_URL, VINCENT_APP_ID } = env;

const BASE_CHAIN_ID = 8453;
const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base
const BASE_USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const SIMPLE_ROUTER_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual router address

// ETH price fetching function
async function fetchETHPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    consola.error('Failed to fetch ETH price:', error);
    throw new Error('Failed to fetch ETH price');
  }
}

// Create payment legs for settlement
function createPaymentLegs(
  fromAddress: string,
  toAddress: string,
  wethAmount: string,
  usdcAmount: string
): Array<{
  amount: string;
  from: string;
  to: string;
  token: string;
}> {
  return [
    {
      amount: ethers.utils.parseEther(wethAmount).toString(),
      from: fromAddress,
      to: toAddress,
      token: BASE_WETH_ADDRESS,
    },
    {
      amount: ethers.utils.parseUnits(usdcAmount, 6).toString(),
      from: toAddress,
      to: fromAddress,
      token: BASE_USDC_ADDRESS,
    },
  ];
}

// Create settlement transaction using Vincent EVM Transaction Signer
async function createSettlementTransaction({
  ethAddress,
  fromAddress,
  toAddress,
  usdcAmount,
  wethAmount,
}: {
  ethAddress: `0x${string}`;
  fromAddress: string;
  toAddress: string;
  usdcAmount: string;
  wethAmount: string;
}): Promise<`0x${string}`> {
  const evmTransactionSignerClient = getEVMTransactionSignerToolClient();

  // Create payment legs
  const paymentLegs = createPaymentLegs(fromAddress, toAddress, wethAmount, usdcAmount);

  // Encode the stageSettlement function call
  const routerInterface = new ethers.utils.Interface([
    'function stageSettlement(address escrow, tuple(address from, address to, address token, uint256 amount)[] paymentLegs, uint256 validForSeconds) external',
  ]);

  const validForSeconds = 3600; // 1 hour
  const escrowAddress = fromAddress; // Using fromAddress as escrow for this example

  const stageSettlementData = routerInterface.encodeFunctionData('stageSettlement', [
    escrowAddress,
    paymentLegs,
    validForSeconds,
  ]);

  // Create transaction object
  const transaction = {
    data: stageSettlementData,
    gasLimit: '0x5208',
    // 21000 gas
    gasPrice: '0x0',

    // Will be set by the network
    chainId: BASE_CHAIN_ID,

    to: SIMPLE_ROUTER_ADDRESS,

    // Will be set by the network
    nonce: 0,

    type: 2,
    value: '0x0', // EIP-1559 transaction
  };

  // Serialize transaction
  const serializedTransaction = ethers.utils.serializeTransaction(transaction);

  const transactionParams = {
    serializedTransaction,
    chainId: BASE_CHAIN_ID,
    rpcUrl: BASE_RPC_URL,
  };

  const transactionContext = {
    delegatorPkpEthAddress: ethAddress,
  };

  // Run precheck
  const precheckResult = await evmTransactionSignerClient.precheck(
    transactionParams,
    transactionContext
  );

  if (!precheckResult.success) {
    throw new Error(`EVM Transaction Signer precheck failed: ${precheckResult}`);
  }

  // Execute transaction
  const executionResult = await evmTransactionSignerClient.execute(
    transactionParams,
    transactionContext
  );

  consola.trace('EVM Transaction Signer Response:', executionResult);
  if (!executionResult.success) {
    throw new Error(`EVM Transaction Signer execution failed: ${executionResult}`);
  }

  return executionResult.result.transactionHash as `0x${string}`;
}

export async function executeSettlement(job: JobType, sentryScope: Sentry.Scope): Promise<void> {
  try {
    const {
      _id,
      data: {
        app,
        fromAddress,
        pkpInfo: { ethAddress },
        toAddress,
      },
    } = job.attrs;

    consola.log('Starting settlement job...', {
      _id,
      ethAddress,
      fromAddress,
      toAddress,
    });

    consola.debug('Fetching ETH price...');
    const [ethPrice, userPermittedAppVersion] = await Promise.all([
      fetchETHPrice(),
      getUserPermittedVersion({ ethAddress, appId: VINCENT_APP_ID }),
    ]);

    sentryScope.addBreadcrumb({
      data: {
        ethPrice,
      },
      message: 'Current ETH price',
    });

    if (!userPermittedAppVersion) {
      throw new Error(
        `User ${ethAddress} revoked permission to run this app. Used version to generate: ${app.version}`
      );
    }

    // Run the saved version or update to the currently permitted one if version is compatible
    const appVersionToRun = assertPermittedVersion(app.version, userPermittedAppVersion);
    sentryScope.addBreadcrumb({
      data: {
        app,
        appVersionToRun,
        userPermittedAppVersion,
      },
    });
    if (appVersionToRun !== app.version) {
      // User updated the permitted app version after creating the job, so we need to update it
      // eslint-disable-next-line no-param-reassign
      job.attrs.data.app = { ...job.attrs.data.app, version: appVersionToRun };
      await job.save();
    }

    consola.log('Settlement details', {
      ethAddress,
      ethPrice,
      fromAddress,
      toAddress,
    });

    // Calculate settlement amounts based on ETH price
    // 1 WETH from address A to address B
    // USDC amount = ETH price * 1 WETH (since 1 WETH = 1 ETH in value)
    const wethAmount = '1.0';
    const usdcAmount = ethPrice.toFixed(6); // Use current ETH price as USDC amount

    // Create payment legs hash for tracking
    const paymentLegs = createPaymentLegs(fromAddress, toAddress, wethAmount, usdcAmount);
    const legsHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['tuple(address from, address to, address token, uint256 amount)[]'],
        [paymentLegs]
      )
    );

    // Create settlement transaction
    const txHash = await createSettlementTransaction({
      fromAddress,
      toAddress,
      usdcAmount,
      wethAmount,
      ethAddress: ethAddress as `0x${string}`,
    });

    sentryScope.addBreadcrumb({
      data: {
        txHash,
      },
    });

    // Create settlement record
    const settlement = new Settlement({
      ethAddress,
      ethPrice,
      fromAddress,
      toAddress,
      usdcAmount,
      wethAmount,

      legsHash,

      txHash,
      // 1 hour from now
      executed: false,
      validUntil: new Date(Date.now() + 60 * 60 * 1000),
    });
    await settlement.save();

    consola.debug(
      `Successfully created settlement at tx hash ${txHash} with ETH price $${ethPrice}`
    );
  } catch (e) {
    // Catch-and-rethrow is usually an antipattern, but Agenda doesn't log failed job reasons to console
    // so this is our chance to log the job failure details using Consola before we throw the error
    // to Agenda, which will write the failure reason to the Agenda job document in Mongo
    const err = normalizeError(e);
    sentryScope.captureException(err);
    consola.error(err.message, err.stack);
    throw e;
  }
}
