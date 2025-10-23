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
import { getDerifunWriteOptionToolClient } from './vincentAbilities';
import { env } from '../../../env';
import { normalizeError } from '../../../error';
import { DerifunWriteOptionJob } from '../../../mongo/models/DerifunWriteOptionJob';

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  name: string;
  pkpInfo: IRelayPKP;
  vault: string;
  amount: number;
  strike: number;
  expiry: number;
  premiumPerUnit: number;
  minDeposit: number;
  maxDeposit: number;
  validUntil: number;
  quoteId: string;
  signature: string;
  updatedAt: Date;
};

const { SEPOLIA_RPC_URL, VINCENT_APP_ID } = env;

const SEPOLIA_CHAIN_ID = 11155111;

const sepoliaProvider = new ethers.providers.StaticJsonRpcProvider(SEPOLIA_RPC_URL);

async function executeDerifunWriteOption({
  delegatorAddress,
  vault,
  amount,
  strike,
  expiry,
  premiumPerUnit,
  minDeposit,
  maxDeposit,
  validUntil,
  quoteId,
  signature,
}: {
  delegatorAddress: `0x${string}`;
  vault: string;
  amount: ethers.BigNumber;
  strike: ethers.BigNumber;
  expiry: number;
  premiumPerUnit: ethers.BigNumber;
  minDeposit: ethers.BigNumber;
  maxDeposit: ethers.BigNumber;
  validUntil: number;
  quoteId: string;
  signature: string;
}): Promise<`0x${string}`> {
  const derifunWriteOptionToolClient = getDerifunWriteOptionToolClient();
  const writeOptionParams = {
    operation: 'writeOption',
    vault,
    amount: amount.toString(),
    strike: strike.toString(),
    expiry: expiry.toString(),
    premiumPerUnit: premiumPerUnit.toString(),
    minDeposit: minDeposit.toString(),
    maxDeposit: maxDeposit.toString(),
    validUntil: validUntil.toString(),
    quoteId,
    signature,
    rpcUrl: SEPOLIA_RPC_URL,
  };
  const writeOptionContext = {
    delegatorPkpEthAddress: delegatorAddress,
  };

  consola.log('Derifun Write Option Tool Parameters:', {
    writeOptionParams,
    writeOptionContext,
    chain: 'sepolia',
    rpcUrl: SEPOLIA_RPC_URL,
  });

  const writeOptionPrecheckResult = await derifunWriteOptionToolClient.precheck(
    writeOptionParams,
    writeOptionContext
  );
  if (!writeOptionPrecheckResult.success) {
    consola.error('Derifun write option tool precheck failed:', {
      success: writeOptionPrecheckResult.success,
      error: writeOptionPrecheckResult.error,
      result: writeOptionPrecheckResult.result,
      writeOptionParams,
      writeOptionContext,
    });
    throw new Error(
      `Derifun write option tool precheck failed: ${JSON.stringify(writeOptionPrecheckResult, null, 2)}`
    );
  }

  const writeOptionExecutionResult = await derifunWriteOptionToolClient.execute(
    writeOptionParams,
    writeOptionContext
  );
  consola.trace('Derifun Write Option Vincent Tool Response:', writeOptionExecutionResult);
  if (!writeOptionExecutionResult.success) {
    consola.error('Derifun write option tool execution failed:', {
      success: writeOptionExecutionResult.success,
      error: writeOptionExecutionResult.error,
      result: writeOptionExecutionResult.result,
      writeOptionParams,
      writeOptionContext,
    });
    throw new Error(
      `Derifun write option tool execution failed: ${JSON.stringify(writeOptionExecutionResult, null, 2)}`
    );
  }

  return writeOptionExecutionResult.result.txHash as `0x${string}`;
}

export async function executeDerifunWriteOptionJob(
  job: JobType,
  sentryScope: Sentry.Scope
): Promise<void> {
  try {
    const {
      _id,
      data: {
        app,
        pkpInfo: { ethAddress, publicKey },
        vault,
        amount,
        strike,
        expiry,
        premiumPerUnit,
        minDeposit,
        maxDeposit,
        validUntil,
        quoteId,
        signature,
      },
    } = job.attrs;

    consola.log('Starting Derifun write option job...', {
      _id,
      ethAddress,
      vault,
      amount,
      strike,
      expiry,
    });

    consola.debug('Fetching user permitted version...');
    const userPermittedAppVersion = await getUserPermittedVersion({
      ethAddress,
      appId: VINCENT_APP_ID,
    });

    sentryScope.addBreadcrumb({
      data: {
        ethAddress,
        vault,
        amount,
        strike,
        expiry,
      },
      message: 'Derifun write option job parameters',
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

    consola.log('Job details', {
      ethAddress,
      vault,
      amount,
      strike,
      expiry,
      userPermittedAppVersion,
    });

    const _amount = ethers.utils.parseUnits(amount.toFixed(18), 18);
    const _strike = ethers.utils.parseUnits(strike.toFixed(18), 18);
    const _premiumPerUnit = ethers.utils.parseUnits(premiumPerUnit.toFixed(18), 18);
    const _minDeposit = ethers.utils.parseUnits(minDeposit.toFixed(18), 18);
    const _maxDeposit = ethers.utils.parseUnits(maxDeposit.toFixed(18), 18);

    const writeOptionHash = await executeDerifunWriteOption({
      delegatorAddress: ethAddress as `0x${string}`,
      vault,
      amount: _amount,
      strike: _strike,
      expiry,
      premiumPerUnit: _premiumPerUnit,
      minDeposit: _minDeposit,
      maxDeposit: _maxDeposit,
      validUntil,
      quoteId,
      signature,
    });
    sentryScope.addBreadcrumb({
      data: {
        writeOptionHash,
      },
    });

    // Create a write option record with all required fields
    const writeOption = new DerifunWriteOptionJob({
      ethAddress,
      vault,
      amount: amount.toFixed(18),
      strike: strike.toFixed(18),
      expiry,
      premiumPerUnit: premiumPerUnit.toFixed(18),
      minDeposit: minDeposit.toFixed(18),
      maxDeposit: maxDeposit.toFixed(18),
      validUntil,
      quoteId,
      signature,
      scheduleId: _id,
      txHash: writeOptionHash,
    });
    await writeOption.save();

    consola.log(`Successfully wrote option`, {
      from: ethAddress,
      vault,
      amount: amount,
      strike: strike,
      expiry,
      txHash: writeOptionHash,
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
