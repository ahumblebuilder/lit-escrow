import { Agenda } from '@whisthub/agenda';
import { IRelayPKP } from '@lit-protocol/types';

import { executeDerifunWriteOptionJob } from './executeDerifunWriteOption';

export type DerifunWriteOptionJobParams = {
  app: {
    id: number;
    version: number;
  };
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

export function defineDerifunWriteOptionJob(agenda: Agenda) {
  agenda.define('executeDerifunWriteOption', executeDerifunWriteOptionJob);
}

export async function scheduleDerifunWriteOptionJob(
  agenda: Agenda,
  jobParams: DerifunWriteOptionJobParams,
  schedule: string
) {
  const job = agenda.create('executeDerifunWriteOption', jobParams);
  job.repeatEvery(schedule);
  job.save();
  return job;
}

export async function cancelDerifunWriteOptionJob(agenda: Agenda, jobId: string) {
  await agenda.cancel({ _id: jobId });
}
