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
    console.log('Initiating Vincent authentication with app ID:', VITE_APP_ID);
    console.log('Redirect URI:', VITE_REDIRECT_URI);

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

      // Debug JWT content
      console.log('JWT token present:', !!authInfo.jwt);
      console.log('JWT length:', authInfo.jwt?.length);

      // Try to decode JWT to see its content (for debugging)
      try {
        const jwtParts = authInfo.jwt.split('.');
        if (jwtParts.length === 3) {
          const payload = JSON.parse(atob(jwtParts[1]));
          console.log('JWT payload:', payload);
          console.log('JWT app ID:', payload.app?.id);
          console.log('Expected app ID:', VITE_APP_ID);
        }
      } catch (e) {
        console.log('Could not decode JWT for debugging:', e);
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
