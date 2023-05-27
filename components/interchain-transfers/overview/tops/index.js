import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'

import Top from './top'
import { getChainData } from '../../../../lib/config'
import { toArray } from '../../../../lib/utils'

const TOPS = ['chains', 'contracts']
const TOP_N = 5

export default ({ data }) => {
  const {
    chains,
  } = useSelector(state => ({ chains: state.chains }), shallowEqual)
  const {
    chains_data,
  } = { ...chains }

  const {
    GMPStats,
    transfersStats,
  } = { ...data }

  const {
    messages,
  } = { ...GMPStats }

  const groupData = data =>
    Object.entries(_.groupBy(toArray(data), 'key')).map(([k, v]) => {
      return {
        key: k,
        num_txs: _.sumBy(v, 'num_txs'),
        volume: _.sumBy(v, 'volume'),
        chain: _.orderBy(_.uniq(toArray(v.map(_v => _v.chain))).map(c => getChainData(c, chains_data)), ['i'], ['asc']).map(c => c.id),
      }
    })

  const getTopData = (data, field = 'num_txs', n = TOP_N) => _.slice(_.orderBy(toArray(data), [field], ['desc']), 0, n)

  const render = id => {
    const chainPairs = groupData(
      _.concat(
        toArray(messages).flatMap(m =>
          toArray(m.source_chains).flatMap(s =>
            toArray(s.destination_chains).map(d => {
              const {
                key,
                num_txs,
                volume,
              } = { ...d }

              return {
                key: `${s.key}_${key}`,
                num_txs,
                volume,
              }
            })
          )
        ),
        toArray(transfersStats?.data).map(d => {
          const {
            source_chain,
            destination_chain,
            num_txs,
            volume,
          } = { ...d }

          return {
            key: `${source_chain}_${destination_chain}`,
            num_txs,
            volume,
          }
        }),
      )
    )
    const sourceChains = groupData(
      _.concat(
        toArray(messages).flatMap(m =>
          toArray(m.source_chains).flatMap(s =>
            toArray(s.destination_chains).map(d => {
              const {
                num_txs,
                volume,
              } = { ...d }

              return {
                key: s.key,
                num_txs,
                volume,
              }
            })
          )
        ),
        toArray(transfersStats?.data).map(d => {
          const {
            source_chain,
            num_txs,
            volume,
          } = { ...d }

          return {
            key: source_chain,
            num_txs,
            volume,
          }
        }),
      )
    )
    const destionationChains = groupData(
      _.concat(
        toArray(messages).flatMap(m =>
          toArray(m.source_chains).flatMap(s =>
            toArray(s.destination_chains).map(d => {
              const {
                key,
                num_txs,
                volume,
              } = { ...d }

              return {
                key,
                num_txs,
                volume,
              }
            })
          )
        ),
        toArray(transfersStats?.data).map(d => {
          const {
            destination_chain,
            num_txs,
            volume,
          } = { ...d }

          return {
            key: destination_chain,
            num_txs,
            volume,
          }
        }),
      )
    )
    const contracts = groupData(
      toArray(messages).flatMap(m =>
        toArray(m.source_chains).flatMap(s =>
          toArray(s.destination_chains).flatMap(d =>
            toArray(d.contracts).map(c => {
              const {
                key,
                num_txs,
                volume,
              } = { ...c }

              return {
                key: key?.toLowerCase(),
                num_txs,
                volume,
                chain: d.key,
              }
            })
          )
        )
      ),
    )

    switch (id) {
      case 'chains':
        return (
          <div key={id} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Top
              data={getTopData(chainPairs)}
              title="Top Paths"
              description="Top chain pairs by transactions"
            />
            <Top
              data={getTopData(sourceChains)}
              title="Top Sources"
              description="Top sources by transactions"
            />
            <Top
              data={getTopData(destionationChains)}
              title="Top Destinations"
              description="Top destinations by transactions"
            />
            <Top
              data={getTopData(chainPairs, 'volume')}
              field="volume"
              title="Top Paths"
              description="Top chain pairs by volumes"
              prefix="$"
            />
            <Top
              data={getTopData(sourceChains, 'volume')}
              field="volume"
              title="Top Sources"
              description="Top sources by volumes"
              prefix="$"
            />
            <Top
              data={getTopData(destionationChains, 'volume')}
              field="volume"
              title="Top Destinations"
              description="Top destinations by volumes"
              prefix="$"
            />
          </div>
        )
      case 'contracts':
        return (
          <div key={id} className="grid sm:grid-cols-2 gap-3">
            <Top
              data={getTopData(contracts, 'num_txs', 10)}
              type="contract"
              title="Top Contracts"
              description="Top contracts by GMP transactions"
            />
            <Top
              data={getTopData(contracts, 'volume', 10)}
              type="contract"
              field="volume"
              title="Top Contracts"
              description="Top contracts by GMP volumes"
              prefix="$"
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {TOPS.map(t => render(t))}
    </div>
  )
}