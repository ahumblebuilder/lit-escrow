import * as Sentry from '@sentry/node';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
// import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { type AppData, assertPermittedVersion } from '../jobVersion';
import { getUserPermittedVersion } from './utils';
import { getOptionsToolClient } from './vincentAbilities';
import { env } from '../../../env';
import { normalizeError } from '../../../error';
import { OptionsTrade } from '../../../mongo/models/PurchasedCoin';

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  depositAmount: string;
  depositToken: string;
  expiry: Date;
  frequency: string;
  minimumApy: number;
  name: string;
  pkpInfo: IRelayPKP;
  strikeThreshold: number;
  updatedAt: Date;
  vaultAddress: string;
};

const { BASE_RPC_URL, VINCENT_APP_ID } = env;

const BASE_CHAIN_ID = 8453;
const PREMIUM_ENDPOINT = 'https://api.example.com/premium'; // TBD endpoint

// Premium data interface from endpoint
interface PremiumData {
  expiry: number;
  premiumPerUnit: number;
  signature: string;
  timestamp: number;
  vaultAddress: string;
}

// Fetch premium data from endpoint
async function fetchPremiumData(vaultAddress: string, expiry: Date): Promise<PremiumData> {
  try {
    const response = await fetch(
      `${PREMIUM_ENDPOINT}?vault=${vaultAddress}&expiry=${expiry.getTime()}`
    );
    if (!response.ok) {
      throw new Error(`Premium endpoint returned ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.premiumPerUnit || !data.signature || !data.timestamp) {
      throw new Error('Invalid premium data structure');
    }

    return data as PremiumData;
  } catch (error) {
    consola.error('Failed to fetch premium data:', error);
    throw new Error('Failed to fetch premium data from endpoint');
  }
}

// Calculate annualized premium percentage
function calculateAnnualizedPremium(
  premiumPerUnit: number,
  depositAmount: number,
  expiry: Date
): number {
  const now = new Date();
  const timeToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365); // Years

  if (timeToExpiry <= 0) {
    return 0;
  }

  const totalPremium = premiumPerUnit * depositAmount;
  const annualizedPremium = totalPremium / depositAmount / timeToExpiry;
  return annualizedPremium * 100; // Convert to percentage
}

// Execute options trade using Vincent Options ability
async function executeOptionsTrade({
  depositAmount,
  depositToken,
  ethAddress,
  premiumData,
  vaultAddress,
}: {
  depositAmount: string;
  depositToken: string;
  ethAddress: `0x${string}`;
  premiumData: PremiumData;
  vaultAddress: string;
}): Promise<`0x${string}`> {
  const optionsToolClient = getOptionsToolClient();

  const optionsParams = {
    depositAmount,
    depositToken,
    vaultAddress,
    chainId: BASE_CHAIN_ID,
    premiumPerUnit: premiumData.premiumPerUnit,
    rpcUrl: BASE_RPC_URL,
    signature: premiumData.signature,
  };

  const optionsContext = {
    delegatorPkpEthAddress: ethAddress,
  };

  // Run precheck
  const precheckResult = await optionsToolClient.precheck(optionsParams, optionsContext);
  if (!precheckResult.success) {
    throw new Error(`Options tool precheck failed: ${precheckResult}`);
  }

  // Execute options trade
  const executionResult = await optionsToolClient.execute(optionsParams, optionsContext);

  consola.trace('Options Tool Response:', executionResult);
  if (!executionResult.success) {
    throw new Error(`Options tool execution failed: ${executionResult}`);
  }

  return executionResult.result.transactionHash as `0x${string}`;
}

export async function executeOptions(job: JobType, sentryScope: Sentry.Scope): Promise<void> {
  try {
    const {
      _id,
      data: {
        app,
        depositAmount,
        depositToken,
        expiry,
        minimumApy,
        pkpInfo: { ethAddress },
        strikeThreshold,
        vaultAddress,
      },
    } = job.attrs;

    consola.log('Starting options execution job...', {
      _id,
      ethAddress,
      expiry,
      minimumApy,
      strikeThreshold,
      vaultAddress,
    });

    consola.debug('Fetching premium data...');
    const [premiumData, userPermittedAppVersion] = await Promise.all([
      fetchPremiumData(vaultAddress, expiry),
      getUserPermittedVersion({ ethAddress, appId: VINCENT_APP_ID }),
    ]);

    sentryScope.addBreadcrumb({
      data: {
        premiumData,
      },
      message: 'Premium data fetched',
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

    // Calculate current spot price (this would come from an oracle in production)
    const currentSpot = 3000; // Placeholder - should be fetched from price oracle
    const strikePrice = currentSpot * (1 + strikeThreshold / 100);

    // Check if strike threshold is met
    if (premiumData.premiumPerUnit < strikePrice) {
      consola.log('Strike threshold not met, skipping execution', {
        currentSpot,
        strikePrice,
        premiumPerUnit: premiumData.premiumPerUnit,
      });
      return;
    }

    // Calculate annualized premium
    const annualizedPremium = calculateAnnualizedPremium(
      premiumData.premiumPerUnit,
      parseFloat(depositAmount),
      expiry
    );

    consola.log('Premium analysis', {
      annualizedPremium,
      minimumApy,
      strikeThreshold,
      premiumPerUnit: premiumData.premiumPerUnit,
    });

    // Check if minimum APY is met
    if (annualizedPremium < minimumApy) {
      consola.log('Minimum APY not met, skipping execution', {
        annualizedPremium,
        minimumApy,
      });
      return;
    }

    consola.log('Conditions met, executing options trade...', {
      annualizedPremium,
      depositAmount,
      ethAddress,
      vaultAddress,
    });

    // Execute the options trade
    const txHash = await executeOptionsTrade({
      depositAmount,
      depositToken,
      premiumData,
      vaultAddress,
      ethAddress: ethAddress as `0x${string}`,
    });

    sentryScope.addBreadcrumb({
      data: {
        txHash,
      },
    });

    // Update options trade record
    await OptionsTrade.findByIdAndUpdate(_id, {
      annualizedPremium,
      currentSpot,
      txHash,
      executed: true,
      optionPremium: premiumData.premiumPerUnit,
    });

    consola.debug(
      `Successfully executed options trade at tx hash ${txHash} with APY ${annualizedPremium.toFixed(2)}%`
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
