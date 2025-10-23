import { Agenda } from '@whisthub/agenda';
import consola from 'consola';

import { executeTransferJob, type JobParams } from './executeTransfer';

const TRANSFER_JOB_NAME = 'executeTransfer';

export function defineTransferJob(agenda: Agenda) {
  agenda.define(TRANSFER_JOB_NAME, async (job) => {
    const sentryScope = {
      addBreadcrumb: (breadcrumb: any) => {
        consola.debug('Sentry breadcrumb:', breadcrumb);
      },
      captureException: (error: any) => {
        consola.error('Sentry exception:', error);
      },
    };

    await executeTransferJob(job, sentryScope);
  });
}

export function scheduleTransferJob(
  agenda: Agenda,
  jobParams: JobParams,
  schedule: string = 'every 1 minute'
) {
  return agenda.schedule(schedule, TRANSFER_JOB_NAME, jobParams);
}

export function cancelTransferJob(agenda: Agenda, jobId: string) {
  return agenda.cancel({ _id: jobId });
}
