import { Response } from 'express';

import { getAppInfo, getPKPInfo, isAppUser } from '@lit-protocol/vincent-app-sdk/jwt';

import { ScheduleIdentitySchema, ScheduleParamsSchema } from './schema';
import { VincentAuthenticatedRequest } from './types';
import * as jobManager from '../agenda/jobs/dcaSwapJobManager';
import * as settlementManager from '../agenda/jobs/settlementJobManager';

const { cancelJob, createJob, disableJob, editJob, enableJob, listJobsByEthAddress } = jobManager;
const {
  cancelSettlementJob,
  createSettlementJob,
  disableSettlementJob,
  enableSettlementJob,
  getSettlementById,
  listSettlementsByEthAddress,
  updateSettlementExecution,
} = settlementManager;

function getDataFromJWT(req: VincentAuthenticatedRequest) {
  if (!isAppUser(req.user.decodedJWT)) {
    throw new Error('Vincent JWT is not an app user');
  }

  const app = getAppInfo(req.user.decodedJWT);
  const pkpInfo = getPKPInfo(req.user.decodedJWT);

  return { app, pkpInfo };
}

export const handleListSchedulesRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const schedules = await listJobsByEthAddress({ ethAddress });

  res.json({ data: schedules.map((sched) => sched.toJson()), success: true });
};

export const handleCreateScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { app, pkpInfo } = getDataFromJWT(req);

  const scheduleParams = ScheduleParamsSchema.parse({
    ...req.body,
    pkpInfo,
    app: {
      id: app.appId,
      version: app.version,
    },
  });

  const schedule = await createJob(
    { ...scheduleParams },
    { interval: scheduleParams.purchaseIntervalHuman }
  );
  res.status(201).json({ data: schedule.toJson(), success: true });
};

export const handleEditScheduleRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const { app, pkpInfo } = getDataFromJWT(req);
  const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

  const scheduleParams = ScheduleParamsSchema.parse({
    ...req.body,
    pkpInfo,
    app: {
      id: app.appId,
      version: app.version,
    },
  });

  const job = await editJob({
    scheduleId,
    data: { ...scheduleParams },
  });
  res.status(201).json({ data: job.toJson(), success: true });
};

export const handleDisableScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);

  const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

  const job = await disableJob({ ethAddress, scheduleId });
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({ data: job.toJson(), success: true });
};

export const handleEnableScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

  const job = await enableJob({ ethAddress, scheduleId });

  res.json({ data: job.toJson(), success: true });
};

export const handleDeleteScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

  await cancelJob({ ethAddress, scheduleId });

  res.json({ success: true });
};

// Settlement routes
export const handleListSettlementsRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const settlements = await listSettlementsByEthAddress({ ethAddress });

  res.json({ data: settlements, success: true });
};

export const handleCreateSettlementRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { app, pkpInfo } = getDataFromJWT(req);

  const settlementParams = {
    ...req.body,
    pkpInfo,
    app: {
      id: app.appId,
      version: app.version,
    },
  };

  const settlement = await createSettlementJob(
    settlementParams,
    { interval: '1 hour' } // Run every hour
  );
  res.status(201).json({ data: settlement.attrs, success: true });
};

export const handleGetSettlementRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const { settlementId } = req.params;
  const settlement = await getSettlementById(settlementId);

  if (!settlement) {
    res.status(404).json({ error: 'Settlement not found' });
    return;
  }

  res.json({ data: settlement, success: true });
};

export const handleUpdateSettlementExecutionRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { settlementId } = req.params;
  const { txHash } = req.body;

  const settlement = await updateSettlementExecution(settlementId, txHash);
  if (!settlement) {
    res.status(404).json({ error: 'Settlement not found' });
    return;
  }

  res.json({ data: settlement, success: true });
};

export const handleCancelSettlementRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const { settlementId } = req.params;

  await cancelSettlementJob({ ethAddress, settlementId });

  res.json({ success: true });
};

export const handleDisableSettlementRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const { settlementId } = req.params;

  const settlement = await disableSettlementJob({ ethAddress, settlementId });
  if (!settlement) {
    res.status(404).json({ error: 'Settlement not found' });
    return;
  }

  res.json({ data: settlement.attrs, success: true });
};

export const handleEnableSettlementRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = getDataFromJWT(req);
  const { settlementId } = req.params;

  const settlement = await enableSettlementJob({ ethAddress, settlementId });

  res.json({ data: settlement.attrs, success: true });
};
