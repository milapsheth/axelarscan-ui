import _ from 'lodash'

import Bar from './bar'
import { toArray } from '../../../../lib/utils'

const CHARTS = ['transactions', 'volumes']

export default ({ data, granularity }) => {
  const {
    GMPStats,
    GMPChart,
    GMPTotalVolume,
    transfersStats,
    transfersChart,
    transfersTotalVolume,
  } = { ...data }

  const {
    messages,
  } = { ...GMPStats }

  const dateFormat = granularity === 'month' ? 'MMM' : undefined

  const render = id => {
    const _data = _.orderBy(
      Object.entries(_.groupBy(_.concat(toArray(GMPChart?.data), toArray(transfersChart?.data)), 'timestamp')).map(([k, v]) => {
        return {
          timestamp: Number(k),
          num_txs: _.sumBy(v, 'num_txs'),
          volume: _.sumBy(v, 'volume'),
        }
      }),
      ['timestamp'], ['asc'],
    )

    let total
    switch (id) {
      case 'transactions':
        total = (_.sumBy(messages, 'num_txs') || 0) + (transfersStats?.total || 0)
        return (
          <Bar
            key={id}
            id={id}
            data={_data}
            totalValue={total}
            field="num_txs"
            title="Transactions"
            description={`Number of transactions by ${granularity}`}
            dateFormat={dateFormat}
            granularity={granularity}
          />
        )
      case 'volumes':
        total = (GMPTotalVolume || 0) + (transfersTotalVolume || 0)
        return (
          <Bar
            key={id}
            id={id}
            data={_data}
            totalValue={total}
            field="volume"
            title="Volumes"
            description={`Transfer volumes by ${granularity}`}
            dateFormat={dateFormat}
            granularity={granularity}
            prefix="$"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {CHARTS.map(c => render(c))}
    </div>
  )
}