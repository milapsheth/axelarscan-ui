import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'

import Metrics from './metrics'
import { getInflation } from '../../lib/api/axelar'
import { toArray } from '../../lib/utils'

export default () => {
  const {
    chain,
    status,
    validators,
  } = useSelector(
    state => (
      {
        chain: state.chain,
        status: state.status,
        validators: state.validators,
      }
    ),
    shallowEqual,
  )
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

  return (
    <div className="children space-y-6 pt-6 px-2 sm:px-4">
      <Metrics data={metrics} />
    </div>
  )
}