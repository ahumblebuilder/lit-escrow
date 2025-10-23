import * as Sentry from '@sentry/node';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { type AppData, assertPermittedVersion } from '../jobVersion';
import {
  balanceOf,
  getERC20Contract,
  getUserPermittedVersion,
  handleOperationExecution,
} from './utils';
import { getErc20TransferToolClient } from './vincentAbilities';
import { env } from '../../../env';
import { normalizeError } from '../../../error';
import { TransferJob } from '../../../mongo/models/TransferJob';

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  name: string;
  pkpInfo: IRelayPKP;
  recipientAddress: string;
  tokenAddress: string;
  amount: number;
  updatedAt: Date;
};

const { SEPOLIA_RPC_URL, VINCENT_APP_ID } = env;

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_TOKEN_ADDRESS = '0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089'; // The token address you specified

const sepoliaProvider = new ethers.providers.StaticJsonRpcProvider(SEPOLIA_RPC_URL);
const tokenContract = getERC20Contract(SEPOLIA_TOKEN_ADDRESS, sepoliaProvider);

async function executeTransfer({
  delegatorAddress,
  recipientAddress,
  tokenAddress,
  amount,
}: {
  delegatorAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  amount: ethers.BigNumber;
}): Promise<`0x${string}`> {
  const erc20TransferToolClient = getErc20TransferToolClient();
  const transferParams = {
    chain: SEPOLIA_CHAIN_ID.toString(),
    rpcUrl: SEPOLIA_RPC_URL,
    tokenAddress,
    to: recipientAddress,
    amount: amount.toString(),
  };
  const transferContext = {
    delegatorPkpEthAddress: delegatorAddress,
  };

  consola.log('ERC20 Transfer Tool Parameters:', {
    transferParams,
    transferContext,
    chain: SEPOLIA_CHAIN_ID.toString(),
    rpcUrl: SEPOLIA_RPC_URL,
  });

  const transferPrecheckResult = await erc20TransferToolClient.precheck(
    transferParams,
    transferContext
  );
  if (!transferPrecheckResult.success) {
    consola.error('ERC20 transfer tool precheck failed:', {
      success: transferPrecheckResult.success,
      error: transferPrecheckResult.error,
      result: transferPrecheckResult.result,
      transferParams,
      transferContext,
    });
    throw new Error(
      `ERC20 transfer tool precheck failed: ${JSON.stringify(transferPrecheckResult, null, 2)}`
    );
  }

  const transferExecutionResult = await erc20TransferToolClient.execute(
    transferParams,
    transferContext
  );
  consola.trace('ERC20 Transfer Vincent Tool Response:', transferExecutionResult);
  if (!transferExecutionResult.success) {
    consola.error('ERC20 transfer tool execution failed:', {
      success: transferExecutionResult.success,
      error: transferExecutionResult.error,
      result: transferExecutionResult.result,
      transferParams,
      transferContext,
    });
    throw new Error(
      `ERC20 transfer tool execution failed: ${JSON.stringify(transferExecutionResult, null, 2)}`
    );
  }

  return transferExecutionResult.result.transferTxHash as `0x${string}`;
}

export async function executeTransferJob(job: JobType, sentryScope: Sentry.Scope): Promise<void> {
  try {
    const {
      _id,
      data: {
        app,
        pkpInfo: { ethAddress, publicKey },
        recipientAddress,
        tokenAddress,
        amount,
      },
    } = job.attrs;

    consola.log('Starting ERC20 transfer job...', {
      _id,
      ethAddress,
      recipientAddress,
      tokenAddress,
      amount,
      tokenContractAddress: SEPOLIA_TOKEN_ADDRESS,
    });

    consola.debug('Fetching user token balance...');
    const [tokenBalance, userPermittedAppVersion] = await Promise.all([
      balanceOf(tokenContract, ethAddress),
      getUserPermittedVersion({ ethAddress, appId: VINCENT_APP_ID }),
    ]);

    sentryScope.addBreadcrumb({
      data: {
        tokenBalance: ethers.utils.formatUnits(tokenBalance, 18),
        tokenAddress: SEPOLIA_TOKEN_ADDRESS,
        ethAddress,
      },
      message: 'User token balance retrieved',
    });

    consola.log('Balance check results:', {
      account: ethAddress,
      token: SEPOLIA_TOKEN_ADDRESS,
      balance: ethers.utils.formatUnits(tokenBalance, 18),
      requestedAmount: amount,
    });

    const _amount = ethers.utils.parseUnits(amount.toFixed(18), 18); // Assuming 18 decimals
    if (tokenBalance.lt(_amount)) {
      const currentBalance = ethers.utils.formatUnits(tokenBalance, 18);
      const requiredAmount = ethers.utils.formatUnits(_amount, 18);
      throw new Error(
        `Insufficient token balance for transfer:\n` +
          `  Account: ${ethAddress}\n` +
          `  Token: ${SEPOLIA_TOKEN_ADDRESS}\n` +
          `  Current Balance: ${currentBalance} tokens\n` +
          `  Required Amount: ${requiredAmount} tokens\n` +
          `  Shortfall: ${ethers.utils.formatUnits(_amount.sub(tokenBalance), 18)} tokens\n` +
          `Please fund this account with more tokens to proceed with the transfer.`
      );
    }
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

    consola.log('Job details', {
      ethAddress,
      recipientAddress,
      tokenAddress,
      amount,
      userPermittedAppVersion,
      tokenBalance: ethers.utils.formatUnits(tokenBalance, 18),
      requiredAmount: ethers.utils.formatUnits(_amount, 18),
      hasEnoughBalance: tokenBalance.gte(_amount),
    });

    const transferHash = await executeTransfer({
      delegatorAddress: ethAddress as `0x${string}`,
      recipientAddress: recipientAddress as `0x${string}`,
      tokenAddress: tokenAddress as `0x${string}`,
      amount: _amount,
    });
    sentryScope.addBreadcrumb({
      data: {
        transferHash,
      },
    });

    // Create a transfer record with all required fields
    const transfer = new TransferJob({
      ethAddress,
      recipientAddress,
      tokenAddress,
      amount: amount.toFixed(18),
      scheduleId: _id,
      txHash: transferHash,
    });
    await transfer.save();

    consola.log(`Successfully transferred ${amount} tokens`, {
      from: ethAddress,
      to: recipientAddress,
      token: tokenAddress,
      amount: amount,
      txHash: transferHash,
      balanceBefore: ethers.utils.formatUnits(tokenBalance, 18),
    });
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
