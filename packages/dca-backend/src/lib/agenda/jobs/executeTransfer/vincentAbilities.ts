import consola from 'consola';
import { bundledVincentAbility as erc20TransferBundledVincentAbility } from '@lit-protocol/vincent-ability-erc20-transfer';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { delegateeSigner } from './utils/signer';

export function getErc20TransferToolClient() {
  consola.log('Creating ERC20 Transfer Tool Client:', {
    hasBundledAbility: !!erc20TransferBundledVincentAbility,
    hasDelegateeSigner: !!delegateeSigner,
    delegateeAddress: delegateeSigner?.address,
  });

  return getVincentAbilityClient({
    bundledVincentAbility: erc20TransferBundledVincentAbility,
    ethersSigner: delegateeSigner,
  });
}
