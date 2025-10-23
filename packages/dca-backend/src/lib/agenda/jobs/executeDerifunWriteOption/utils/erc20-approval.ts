import consola from 'consola';
import { vincentAbility as erc20ApprovalVincentAbility } from '@lit-protocol/vincent-ability-erc20-approval';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { delegateeSigner } from './signer';

export function getErc20ApprovalToolClient() {
  consola.log('Creating ERC20 Approval Tool Client:', {
    hasBundledAbility: !!erc20ApprovalVincentAbility,
    hasDelegateeSigner: !!delegateeSigner,
    delegateeAddress: delegateeSigner?.address,
  });

  return getVincentAbilityClient({
    bundledVincentAbility: erc20ApprovalVincentAbility,
    ethersSigner: delegateeSigner,
  });
}

export async function approveDepositToken({
  delegatorAddress,
  tokenAddress,
  spenderAddress,
  amount,
  rpcUrl,
}: {
  delegatorAddress: `0x${string}`;
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  rpcUrl: string;
}): Promise<`0x${string}`> {
  const erc20ApprovalToolClient = getErc20ApprovalToolClient();

  const approvalParams = {
    chain: 'sepolia',
    rpcUrl,
    tokenAddress,
    spender: spenderAddress,
    amount,
  };

  const approvalContext = {
    delegatorPkpEthAddress: delegatorAddress,
  };

  consola.log('ERC20 Approval Parameters:', {
    approvalParams,
    approvalContext,
  });

  consola.log('Calling ERC20 approval tool precheck...');
  const approvalPrecheckResult = await erc20ApprovalToolClient.precheck(
    approvalParams,
    approvalContext
  );

  consola.log('ERC20 approval precheck result:', {
    success: approvalPrecheckResult.success,
    error: approvalPrecheckResult.error,
    result: approvalPrecheckResult.result,
  });

  if (!approvalPrecheckResult.success) {
    consola.error('ERC20 approval tool precheck failed:', {
      success: approvalPrecheckResult.success,
      error: approvalPrecheckResult.error,
      result: approvalPrecheckResult.result,
      approvalParams,
      approvalContext,
    });
    throw new Error(
      `ERC20 approval tool precheck failed: ${JSON.stringify(approvalPrecheckResult, null, 2)}`
    );
  }

  consola.log('Calling ERC20 approval tool execute...');
  const approvalExecutionResult = await erc20ApprovalToolClient.execute(
    approvalParams,
    approvalContext
  );

  consola.log('ERC20 approval execution result:', {
    success: approvalExecutionResult.success,
    error: approvalExecutionResult.error,
    result: approvalExecutionResult.result,
  });

  if (!approvalExecutionResult.success) {
    consola.error('ERC20 approval tool execution failed:', {
      success: approvalExecutionResult.success,
      error: approvalExecutionResult.error,
      result: approvalExecutionResult.result,
      approvalParams,
      approvalContext,
    });
    throw new Error(
      `ERC20 approval tool execution failed: ${JSON.stringify(approvalExecutionResult, null, 2)}`
    );
  }

  return approvalExecutionResult.result.txHash as `0x${string}`;
}
