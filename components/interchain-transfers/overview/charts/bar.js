import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell } from 'recharts'
import { Card, CardBody } from '@material-tailwind/react'
import _ from 'lodash'
import moment from 'moment'

import Spinner from '../../../spinner'
import NumberDisplay from '../../../number'
import { split, toArray, chartColor } from '../../../../lib/utils'

export default (
  {
    id = 'transactions',
    data,
    totalValue,
    field = 'num_txs',
    title = '',
    description = '',
    dateFormat = 'D MMM',
    granularity = 'day',
    prefix = '',
  },
) => {
  const {
    preferences,
  } = useSelector(state => ({ preferences: state.preferences }), shallowEqual)
  const {
    theme,
  } = { ...preferences }

  const [chartData, setChartData] = useState(null)
  const [x, setX] = useState(null)

  useEffect(
    () => {
      if (data) {
        setChartData(
          toArray(data).map(d => {
            const {
              timestamp,
            } = { ...d }

            const time = moment(timestamp).utc()
            const time_string = time.format(dateFormat)
            let focus_time_string

            switch (granularity) {
              case 'month':
                focus_time_string = time.format('MMM YY')
                break
              case 'week':
                focus_time_string = [time.format(dateFormat), moment(time).add(7, 'days').format(dateFormat)].join(' - ')
                break
              default:
                focus_time_string = time_string
                break
            }

            return {
              ...d,
              time_string,
              focus_time_string,
            }
          })
        )
      }
    },
    [data],
  )

  const d = toArray(chartData).find(d => d.timestamp === x)
  const value = d ? d[field] : chartData ? totalValue || _.sumBy(chartData, field) : null
  const time_string = d ? d.focus_time_string : chartData ? toArray([_.head(split(_.head(chartData)?.focus_time_string, 'normal', ' - ')), _.last(split(_.last(chartData)?.focus_time_string, 'normal', ' - '))]).join(' - ') : null

  return (
    <Card key={id} className="card">
      <CardBody className="space-y-1.5 -mb-4">
        <div className="flex items-start justify-between space-x-2">
          <div className="flex flex-col space-y-0.5">
            <span className="text-black dark:text-white text-base font-medium">
              {title}
            </span>
            {description && (
              <span className="text-slate-400 dark:text-slate-500 text-sm">
                {description}
              </span>
            )}
          </div>
          {typeof value === 'number' && (
            <div className="flex flex-col items-end">
              <NumberDisplay
                value={value}
                format="0,0"
                prefix={prefix}
                className="text-black dark:text-white text-base font-medium"
              />
              <span className="whitespace-nowrap text-slate-400 dark:text-slate-500 text-sm text-right">
                {time_string}
              </span>
            </div>
          )}
        </div>
        <div className="w-full h-64">
          {chartData ?
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                onMouseEnter={e => setX(_.head(e?.activePayload)?.payload?.timestamp)}
                onMouseMove={e => setX(_.head(e?.activePayload)?.payload?.timestamp)}
                onMouseLeave={() => setX(null)}
                margin={{ top: 12, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis dataKey="time_string" axisLine={false} tickLine={false} />
                <Bar dataKey={field} minPointSize={5}>
                  {chartData.map((d, i) => <Cell key={i} fill={chartColor(theme)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer> :
            <div className="w-full h-full flex items-center justify-center">
              <Spinner name="ProgressBar" width={36} height={36} />
            </div>
          }
        </div>
      </CardBody>
    </Card>
  )
}