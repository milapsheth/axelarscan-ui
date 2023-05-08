import { combineReducers } from 'redux'

import preferences from './preferences'
import chains from './chains'
import assets from './assets'
import ens from './ens'
import accounts from './accounts'
import status from './status'
import maintainers from './maintainers'
import tvl from './tvl'
import validators from './validators'
import profiles from './profiles'
import rpcs from './rpcs'
import wallet from './wallet'

export default combineReducers(
  {
    preferences,
    chains,
    assets,
    ens,
    accounts,
    status,
    maintainers,
    tvl,
    validators,
    profiles,
    rpcs,
    wallet,
  },
)