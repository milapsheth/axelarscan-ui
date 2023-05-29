import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import Metrics from './metrics'
import { getInflation } from '../../lib/api/axelar'
import { GMPStats, GMPTotalVolume } from '../../lib/api/gmp'
import { transfersStats, transfersTotalVolume } from '../../lib/api/transfers'
import { toArray } from '../../lib/utils'

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
        setInterchainData(
          Object.fromEntries(
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
        )
      }
      getData()
    },
    [],
  )

  return (
    <div className="children space-y-6 pt-6 px-2 sm:px-4">
      <Metrics data={{ ...metrics, ...interchainData, chains_data }} />
    </div>
  )
}