import _ from 'lodash'

import Top from './top'
import { toArray } from '../../../../lib/utils'

const TOPS = ['chains', 'contracts']
const TOP_N = 5

export default ({ data }) => {
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
      }
    })

  const getTopData = (data, field = 'num_txs') => _.slice(_.orderBy(toArray(data), [field], ['desc']), 0, TOP_N)

  const render = id => {
    const className = 'grid sm:grid-cols-2 xl:grid-cols-3 gap-3'

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

    switch (id) {
      case 'chains':
        return (
          <div key={id} className={className}>
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
          <div key={id} className={className}>
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