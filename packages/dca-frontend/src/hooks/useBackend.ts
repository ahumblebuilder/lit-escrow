import { useCallback } from 'react';

import { useJwtContext, useVincentWebAuthClient } from '@lit-protocol/vincent-app-sdk/react';

import { env } from '@/config/env';

const { VITE_APP_ID, VITE_BACKEND_URL, VITE_REDIRECT_URI } = env;

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TransferJob = {
  id: string;
  name: string;
  nextRunAt: string;
  enabled: boolean;
};

export interface CreateTransferJobRequest {
  recipientAddress: string;
  tokenAddress: string;
  amount: number;
}

export type DerifunWriteOptionJob = {
  id: string;
  name: string;
  nextRunAt: string;
  enabled: boolean;
};

export interface CreateDerifunWriteOptionJobRequest {
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
}

export const useBackend = () => {
  const { authInfo } = useJwtContext();
  const vincentWebAuthClient = useVincentWebAuthClient(VITE_APP_ID);

  const getJwt = useCallback(() => {
    // Redirect to Vincent Auth consent page with appId and version
    vincentWebAuthClient.redirectToConnectPage({
      // consentPageUrl: `http://localhost:3000/`,
      redirectUri: VITE_REDIRECT_URI,
    });
  }, [vincentWebAuthClient]);

  const sendRequest = useCallback(
    async <T>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<T> => {
      if (!authInfo?.jwt) {
        throw new Error('No JWT to query backend');
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${authInfo.jwt}`,
      };
      if (body != null) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${VITE_BACKEND_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as { data: T; success: boolean };

      if (!json.success) {
        throw new Error(`Backend error: ${json.data}`);
      }

      return json.data;
    },
    [authInfo]
  );

  const createTransferJob = useCallback(
    async (transferJob: CreateTransferJobRequest) => {
      return sendRequest<TransferJob>('/transfer-job', 'POST', transferJob);
    },
    [sendRequest]
  );

  const cancelTransferJob = useCallback(
    async (jobId: string) => {
      return sendRequest<void>(`/transfer-job/${jobId}`, 'DELETE');
    },
    [sendRequest]
  );

  const createDerifunWriteOptionJob = useCallback(
    async (derifunJob: CreateDerifunWriteOptionJobRequest) => {
      return sendRequest<DerifunWriteOptionJob>('/derifun-write-option-job', 'POST', derifunJob);
    },
    [sendRequest]
  );

  const cancelDerifunWriteOptionJob = useCallback(
    async (jobId: string) => {
      return sendRequest<void>(`/derifun-write-option-job/${jobId}`, 'DELETE');
    },
    [sendRequest]
  );

  return {
    createTransferJob,
    cancelTransferJob,
    createDerifunWriteOptionJob,
    cancelDerifunWriteOptionJob,
    getJwt,
  };
};
