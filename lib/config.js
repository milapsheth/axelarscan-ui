import _ from 'lodash'

import { toArray, equalsIgnoreCase, normalizeQuote } from './utils'

const getChainKey = (
  chain,
  chains_data,
) => {
  let key

  if (chain) {
    chain = normalizeQuote(chain, 'lower')

    key =
      _.head(
        toArray(chains_data)
          .filter(c => {
            const {
              id,
              chain_name,
              maintainer_id,
              prefix_address,
              prefix_chain_ids,
              chain_type,
            } = { ...c }

            return (
              toArray([id, chain_name, maintainer_id, prefix_address]).findIndex(s => equalsIgnoreCase(chain, s) || (chain_type !== 'evm' && chain.startsWith(s))) > -1 ||
              toArray(prefix_chain_ids).findIndex(p => chain.startsWith(p)) > -1
            )
          })
          .map(c => c.id)
      )

    key = key || chain
  }

  return key
}

export const getChainData = (
  chain,
  chains_data,
) =>
  chain && toArray(chains_data).find(c => c.id === getChainKey(chain, chains_data))

export const getAssetData = (
  asset,
  assets_data,
) =>
  asset && toArray(assets_data).find(a => equalsIgnoreCase(a.denom, asset) || toArray(a.denoms).findIndex(d => equalsIgnoreCase(d, asset)) > -1 || equalsIgnoreCase(a.symbol, asset) || toArray(Object.values({ ...a.addresses })).findIndex(_a => equalsIgnoreCase(_a.ibc_denom, asset)) > -1)