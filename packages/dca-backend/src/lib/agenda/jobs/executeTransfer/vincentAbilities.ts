import { bundledVincentAbility as erc20TransferBundledVincentAbility } from '@lit-protocol/vincent-ability-erc20-transfer';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { delegateeSigner } from './utils/signer';

export function getErc20TransferToolClient() {
  return getVincentAbilityClient({
    bundledVincentAbility: erc20TransferBundledVincentAbility,
    ethersSigner: delegateeSigner,
  });
}
