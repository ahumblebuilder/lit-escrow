import { Response } from 'express';
import { getAppInfo, getPKPInfo, isAppUser } from '@lit-protocol/vincent-app-sdk/jwt';
import { VincentAuthenticatedRequest } from './types';
import {
  defineDerifunWriteOptionJob,
  scheduleDerifunWriteOptionJob,
  cancelDerifunWriteOptionJob,
} from '../agenda/jobs/derifunWriteOptionJobManager';
import { Agenda } from '@whisthub/agenda';

function getDataFromJWT(req: VincentAuthenticatedRequest) {
  const app = getAppInfo(req);
  const pkpInfo = getPKPInfo(req);
  const isUser = isAppUser(req);

  if (!isUser) {
    throw new Error('User is not authorized to use this app');
  }

  return { app, pkpInfo };
}

export const handleCreateDerifunWriteOptionJobRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const { app, pkpInfo } = getDataFromJWT(req);
    const agenda = req.app.locals.agenda as Agenda;

    if (!agenda) {
      return res.status(500).json({
        error: 'Agenda not initialized',
        success: false,
      });
    }

    defineDerifunWriteOptionJob(agenda);

    const {
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
    } = req.body;

    if (
      !vault ||
      !amount ||
      !strike ||
      !expiry ||
      !premiumPerUnit ||
      !minDeposit ||
      !maxDeposit ||
      !validUntil ||
      !quoteId ||
      !signature
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: vault, amount, strike, expiry, premiumPerUnit, minDeposit, maxDeposit, validUntil, quoteId, signature',
        success: false,
      });
    }

    const jobParams = {
      app: {
        id: app.appId,
        version: app.version,
      },
      name: 'Derifun Write Option Job',
      pkpInfo,
      vault,
      amount: parseFloat(amount),
      strike: parseFloat(strike),
      expiry: parseInt(expiry),
      premiumPerUnit: parseFloat(premiumPerUnit),
      minDeposit: parseFloat(minDeposit),
      maxDeposit: parseFloat(maxDeposit),
      validUntil: parseInt(validUntil),
      quoteId,
      signature,
      updatedAt: new Date(),
    };

    const job = await scheduleDerifunWriteOptionJob(agenda, jobParams, 'every 1 minute');

    res.status(201).json({
      data: {
        id: job.attrs._id,
        name: job.attrs.name,
        nextRunAt: job.attrs.nextRunAt,
        enabled: job.attrs.disabled === false,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error creating Derifun write option job:', error);
    res.status(500).json({
      error: 'Internal server error',
      success: false,
    });
  }
};

export const handleCancelDerifunWriteOptionJobRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { jobId } = req.params;
  const agenda = req.app.locals.agenda as Agenda;

  await cancelDerifunWriteOptionJob(agenda, jobId);

  res.json({ success: true });
};
