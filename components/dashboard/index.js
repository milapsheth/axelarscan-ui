import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'

import Metrics from './metrics'
import { getInflation } from '../../lib/api/axelar'
import { GMPStats, GMPTotalVolume } from '../../lib/api/gmp'
import { transfersStats, transfersTotalVolume } from '../../lib/api/transfers'
import { getChainData } from '../../lib/config'
import { split, toArray, normalizeQuote } from '../../lib/utils'

export default () => {
  const {
    chains,
    chain,
    status,
    validators,
  } = useSelector(
    state => (
      {
        chains: state.chains,
        chain: state.chain,
        status: state.status,
        validators: state.validators,
      }
    ),
    shallowEqual,
  )
  const {
    chains_data,
  } = { ...chains }
  const {
    chain_data,
  } = { ...chain }
  const {
    status_data,
  } = { ...status }
  const {
    validators_data,
  } = { ...validators }

  const [inflationData, setInflationData] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [interchainData, setInterchainData] = useState(null)

  useEffect(
    () => {
      const getData = async () => setInflationData(await getInflation())
      getData()
    },
    [],
  )

  useEffect(
    () => {
      if (chain_data && status_data) {
        const {
          bank_supply,
          staking_pool,
        } = { ...chain_data }

        const {
          symbol,
          amount,
        } = { ...bank_supply }

        const {
          bonded_tokens,
        } = { ...staking_pool }

        setMetrics({
          block_data: status_data,
          validators_data: validators_data && { active: validators_data.filter(v => v.status === 'BOND_STATUS_BONDED').length, total: validators_data.length },
          token_data: bank_supply && staking_pool && { symbol, staked: bonded_tokens, total_supply: amount },
          inflation_data: inflationData,
        })
      }
    },
    [chain_data, status_data, validators_data, inflationData],
  )

  useEffect(
    () => {
      const metrics = ['GMPStats', 'GMPTotalVolume', 'transfersStats', 'transfersTotalVolume']

      const getData = async () => {
        if (chains_data) {
          const interchainData = Object.fromEntries(
            await Promise.all(
              toArray(
                metrics.map(m =>
                  new Promise(
                    async resolve => {
                      switch (m) {
                        case 'GMPStats':
                          resolve([m, await GMPStats()])
                          break
                        case 'GMPTotalVolume':
                          resolve([m, await GMPTotalVolume()])
                          break
                        case 'transfersStats':
                          resolve([m, await transfersStats()])
                          break
                        case 'transfersTotalVolume':
                          resolve([m, await transfersTotalVolume()])
                          break
                        default:
                          resolve()
                          break
                      }
                    }
                  )
                )
              )
            )
          )

          const {
            messages,
          } = { ...interchainData?.GMPStats }

          const {
            data,
          } = { ...interchainData?.transfersStats }

          interchainData.networkGraph = _.orderBy(
            Object.entries(
              _.groupBy(
                _.concat(
                  toArray(messages).flatMap(m =>
                    toArray(m.source_chains).flatMap(s =>
                      toArray(s.destination_chains).map(d => {
                        const {
                          num_txs,
                          volume,
                        } = { ...d }

                        const source_chain = normalizeQuote(s.key)
                        const destination_chain = normalizeQuote(d.key)

                        return {
                          id: toArray([source_chain, destination_chain]).join('_'),
                          source_chain,
                          destination_chain,
                          num_txs,
                          volume,
                        }
                      })
                    )
                  ),
                  toArray(data).map(d => {
                    const {
                      id,
                      source_chain,
                      destination_chain,
                      num_txs,
                      volume,
                    } = { ...d }

                    return {
                      id: toArray([source_chain, destination_chain]).join('_'),
                      source_chain,
                      destination_chain,
                      num_txs,
                      volume,
                    }
                  }),
                )
                .filter(d => getChainData(d.source_chain, chains_data) && getChainData(d.destination_chain, chains_data)),
                'id',
              )
            )
            .map(([k, v]) => {
              return {
                ..._.head(v),
                id: k,
                num_txs: _.sumBy(v, 'num_txs'),
                volume: _.sumBy(v, 'volume'),
              }
            }),
            ['num_txs'], ['desc'],
          )

          setInterchainData(interchainData)
        }
      }

      getData()
      const interval = setInterval(() => getData(), 60 * 1000)
      return () => clearInterval(interval)
    },
    [chains_data],
  )

  return (
    <div className="children space-y-6 pt-6 px-2 sm:px-4">
      <Metrics data={{ ...metrics, ...interchainData, chains_data }} />
    </div>
  )
}