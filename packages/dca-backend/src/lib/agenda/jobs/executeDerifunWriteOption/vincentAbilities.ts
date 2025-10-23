import consola from 'consola';
import { vincentAbility as derifunVincentAbility } from '@ahumblebuilder/derifun-ability';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { delegateeSigner } from './utils/signer';

export function getDerifunWriteOptionToolClient() {
  consola.log('Creating Derifun Write Option Tool Client:', {
    hasBundledAbility: !!derifunVincentAbility,
    hasDelegateeSigner: !!delegateeSigner,
    delegateeAddress: delegateeSigner?.address,
  });

  return getVincentAbilityClient({
    bundledVincentAbility: derifunVincentAbility,
    ethersSigner: delegateeSigner,
  });
}
