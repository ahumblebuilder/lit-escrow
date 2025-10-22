import * as Sentry from '@sentry/node';
import consola from 'consola';

import { createAgenda, getAgenda } from './agenda/agendaClient';
import { executeDCASwapJobDef, executeSettlementJobDef, executeOptionsJobDef } from './agenda/jobs';
import { executeDCASwap } from './agenda/jobs/executeDCASwap/executeDCASwap';
import { executeOptions } from './agenda/jobs/executeOptions/executeOptions';
import { executeSettlement } from './agenda/jobs/executeSettlement/executeSettlement';

// Function to create and configure a new agenda instance
export async function startWorker() {
  await createAgenda();

  const agenda = getAgenda();

  agenda.define('executeDCASwap', async (job: executeDCASwapJobDef.JobType) =>
    Sentry.withIsolationScope(async (scope) => {
      // TODO: add job-aware logic such as cool-downs in case of repeated failures here

      try {
        await executeDCASwap(job, scope);
      } catch (err) {
        scope.captureException(err);
        const error = err as Error;
        // If we get an error we know is non-transient (the user must fix the state), disable the job
        // The user can re-enable it after resolving the fatal error.
        if (
          error?.message?.includes('Not enough balance') ||
          error?.message?.includes('insufficient funds') ||
          error?.message?.includes('gas too low') ||
          error?.message?.includes('out of gas')
        ) {
          consola.log(`Disabling job due to fatal error: ${error.message}`);
          job.disable();
          await job.save();
          throw new Error(`DCA schedule disabled due to fatal error: ${error.message}`);
        }
        // Other errors just bubble up to the job doc
        throw err;
      } finally {
        Sentry.flush(2000);
      }
    })
  );

  agenda.define('executeSettlement', async (job: executeSettlementJobDef.JobType) =>
    Sentry.withIsolationScope(async (scope) => {
      try {
        await executeSettlement(job, scope);
      } catch (err) {
        scope.captureException(err);
        const error = err as Error;
        // If we get an error we know is non-transient (the user must fix the state), disable the job
        if (
          error?.message?.includes('Failed to fetch ETH price') ||
          error?.message?.includes('EVM Transaction Signer') ||
          error?.message?.includes('insufficient funds') ||
          error?.message?.includes('gas too low') ||
          error?.message?.includes('out of gas')
        ) {
          consola.log(`Disabling settlement job due to fatal error: ${error.message}`);
          job.disable();
          await job.save();
          throw new Error(`Settlement job disabled due to fatal error: ${error.message}`);
        }
        // Other errors just bubble up to the job doc
        throw err;
      } finally {
        Sentry.flush(2000);
      }
    })
  );

  agenda.define('executeOptions', async (job: executeOptionsJobDef.JobType) =>
    Sentry.withIsolationScope(async (scope) => {
      try {
        await executeOptions(job, scope);
      } catch (err) {
        scope.captureException(err);
        const error = err as Error;
        // If we get an error we know is non-transient (the user must fix the state), disable the job
        if (
          error?.message?.includes('Failed to fetch premium data') ||
          error?.message?.includes('Options tool') ||
          error?.message?.includes('insufficient funds') ||
          error?.message?.includes('gas too low') ||
          error?.message?.includes('out of gas')
        ) {
          consola.log(`Disabling options job due to fatal error: ${error.message}`);
          job.disable();
          await job.save();
          throw new Error(`Options job disabled due to fatal error: ${error.message}`);
        }
        // Other errors just bubble up to the job doc
        throw err;
      } finally {
        Sentry.flush(2000);
      }
    })
  );

  return agenda;
}
