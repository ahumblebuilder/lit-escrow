import { Agenda } from '@whisthub/agenda';

import { OptionsTrade } from '../../mongo/models/PurchasedCoin';

const { VINCENT_APP_ID } = process.env;

export type OptionsJobData = {
  app: {
    id: string;
    version: string;
  };
  depositAmount: string;
  depositToken: string;
  ethAddress: string;
  expiry: Date;
  frequency: string;
  minimumApy: number;
  pkpInfo: {
    ethAddress: string;
    publicKey: string;
  };
  strikeThreshold: number;
  updatedAt: Date;
  vaultAddress: string;
};

export async function createOptionsJob(data: OptionsJobData, options: { interval: string }) {
  const agenda = new Agenda();
  await agenda.start();

  const job = agenda.create('executeOptions', {
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

export async function listOptionsTradesByEthAddress({ ethAddress }: { ethAddress: string }) {
  return OptionsTrade.find({ ethAddress }).sort({ createdAt: -1 });
}

export async function getOptionsTradeById(tradeId: string) {
  return OptionsTrade.findById(tradeId);
}

export async function updateOptionsTradeExecution(tradeId: string, txHash: string) {
  return OptionsTrade.findByIdAndUpdate(tradeId, { txHash, executed: true }, { new: true });
}

export async function cancelOptionsJob({
  ethAddress,
  tradeId,
}: {
  ethAddress: string;
  tradeId: string;
}) {
  const agenda = new Agenda();
  await agenda.start();

  const jobs = await agenda.jobs({ 'data._id': tradeId, 'data.ethAddress': ethAddress });

  await Promise.all(jobs.map((job) => job.remove()));

  await agenda.close();
  return true;
}

export async function disableOptionsJob({
  ethAddress,
  tradeId,
}: {
  ethAddress: string;
  tradeId: string;
}) {
  const agenda = new Agenda();
  await agenda.start();

  const jobs = await agenda.jobs({ 'data._id': tradeId, 'data.ethAddress': ethAddress });

  await Promise.all(jobs.map((job) => job.disable()));

  await agenda.close();
  return jobs[0] || null;
}

export async function enableOptionsJob({
  ethAddress,
  tradeId,
}: {
  ethAddress: string;
  tradeId: string;
}) {
  const agenda = new Agenda();
  await agenda.start();

  const jobs = await agenda.jobs({ 'data._id': tradeId, 'data.ethAddress': ethAddress });

  await Promise.all(jobs.map((job) => job.enable()));

  await agenda.close();
  return jobs[0] || null;
}
