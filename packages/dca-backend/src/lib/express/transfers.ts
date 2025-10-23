import { Response } from 'express';

import { getAppInfo, getPKPInfo, isAppUser } from '@lit-protocol/vincent-app-sdk/jwt';

import { VincentAuthenticatedRequest } from './types';
import {
  defineTransferJob,
  scheduleTransferJob,
  cancelTransferJob,
} from '../agenda/jobs/transferJobManager';
import { Agenda } from '@whisthub/agenda';

function getDataFromJWT(req: VincentAuthenticatedRequest) {
  if (!isAppUser(req.user.decodedJWT)) {
    throw new Error('Vincent JWT is not an app user');
  }

  const app = getAppInfo(req.user.decodedJWT);
  const pkpInfo = getPKPInfo(req.user.decodedJWT);

  return { app, pkpInfo };
}

export const handleCreateTransferJobRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { app, pkpInfo } = getDataFromJWT(req);
  const agenda = req.app.locals.agenda as Agenda;

  // Define the job if not already defined
  defineTransferJob(agenda);

  const { recipientAddress, tokenAddress, amount } = req.body;

  const jobParams = {
    app: {
      id: app.appId,
      version: app.version,
    },
    name: 'ERC20 Transfer Job',
    pkpInfo,
    recipientAddress,
    tokenAddress,
    amount: parseFloat(amount),
    updatedAt: new Date(),
  };

  const job = await scheduleTransferJob(agenda, jobParams, 'every 1 minute');

  res.status(201).json({
    data: {
      id: job.attrs._id,
      name: job.attrs.name,
      nextRunAt: job.attrs.nextRunAt,
      enabled: job.attrs.disabled === false,
    },
    success: true,
  });
};

export const handleCancelTransferJobRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { jobId } = req.params;
  const agenda = req.app.locals.agenda as Agenda;

  await cancelTransferJob(agenda, jobId);

  res.json({ success: true });
};
