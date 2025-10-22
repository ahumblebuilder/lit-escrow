import { Agenda } from '@whisthub/agenda';

import { OptionsTrade } from '../../mongo/models/PurchasedCoin';

const { VINCENT_APP_ID } = process.env;

export type SettlementJobData = {
  app: {
    id: string;
    version: string;
  };
  ethAddress: string;
  fromAddress: string;
  pkpInfo: {
    ethAddress: string;
    publicKey: string;
  };
  toAddress: string;
  updatedAt: Date;
};

export async function createSettlementJob(data: SettlementJobData, options: { interval: string }) {
  const agenda = new Agenda();
  await agenda.start();

  const job = agenda.create('executeSettlement', {
    ...data,
    app: {
      id: VINCENT_APP_ID,
      version: data.app.version,
    },
  });

  await job.repeatEvery(options.interval).save();
  await agenda.close();

  return job;
}

export async function listSettlementsByEthAddress({ ethAddress }: { ethAddress: string }) {
  return OptionsTrade.find({ ethAddress }).sort({ createdAt: -1 });
}

export async function getSettlementById(settlementId: string) {
  return OptionsTrade.findById(settlementId);
}

export async function updateSettlementExecution(settlementId: string, txHash: string) {
  return OptionsTrade.findByIdAndUpdate(settlementId, { txHash, executed: true }, { new: true });
}

export async function cancelSettlementJob({
  ethAddress,
  settlementId,
}: {
  ethAddress: string;
  settlementId: string;
}) {
  const agenda = new Agenda();
  await agenda.start();

  const jobs = await agenda.jobs({ 'data._id': settlementId, 'data.ethAddress': ethAddress });

  await Promise.all(jobs.map((job) => job.remove()));

  await agenda.close();
  return true;
}

export async function disableSettlementJob({
  ethAddress,
  settlementId,
}: {
  ethAddress: string;
  settlementId: string;
}) {
  const agenda = new Agenda();
  await agenda.start();

  const jobs = await agenda.jobs({ 'data._id': settlementId, 'data.ethAddress': ethAddress });

  await Promise.all(jobs.map((job) => job.disable()));

  await agenda.close();
  return jobs[0] || null;
}

export async function enableSettlementJob({
  ethAddress,
  settlementId,
}: {
  ethAddress: string;
  settlementId: string;
}) {
  const agenda = new Agenda();
  await agenda.start();

  const jobs = await agenda.jobs({ 'data._id': settlementId, 'data.ethAddress': ethAddress });

  await Promise.all(jobs.map((job) => job.enable()));

  await agenda.close();
  return jobs[0] || null;
}
