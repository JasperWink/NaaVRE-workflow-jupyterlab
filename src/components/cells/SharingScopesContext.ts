import { createContext } from 'react';

import { ISharingScope } from '../../naavre-common/types/NaaVRECatalogue/BaseAssets';

export const SharingScopesContext = createContext<ISharingScope[]>([]);
