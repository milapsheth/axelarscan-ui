import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import moment from 'moment'

import Summary from './summary'
import Charts from './charts'
import Tops from './tops'
import Spinner from '../../spinner'
import { GMPStats, GMPChart, GMPTotalVolume } from '../../../lib/api/gmp'
import { transfersStats, transfersChart, transfersTotalVolume } from '../../../lib/api/transfers'
import { toArray, getQueryParams, createMomentFromUnixtime } from '../../../lib/utils'

const getGranularity = (fromTime, toTime) => {
  if (fromTime) {
    const diff = createMomentFromUnixtime(toTime).diff(createMomentFromUnixtime(fromTime), 'days')
    if (diff >= 180) {
      return 'month'
    }
    else if (diff >= 60) {
      return 'week'
    }
    else {
      return 'day'
    }
  }
  return 'month'
}

export default () => {
  const router = useRouter()
  const {
    asPath,
  } = { ...router }

  const [data, setData] = useState(null)
  const [filters, setFilters] = useState(null)
  const [fetchTrigger, setFetchTrigger] = useState(null)
  const [fetching, setFetching] = useState(false)

  useEffect(
    () => {
      if (asPath) {
        setFilters({ ...getQueryParams(asPath) })
      }
    },
    [asPath],
  )

  useEffect(
    () => {
      const trigger = is_interval => {
        if (filters) {
          setFetchTrigger(is_interval ? moment().valueOf() : typeof fetchTrigger === 'number' ? null : 0)
        }
      }

      trigger()
      const interval = setInterval(() => trigger(true), 5 * 60 * 1000)
      return () => clearInterval(interval)
    },
    [filters],
  )

  useEffect(
    () => {
      const metrics = ['GMPStats', 'GMPStatsAVGTimes', 'GMPChart', 'GMPTotalVolume', 'transfersStats', 'transfersChart', 'transfersTotalVolume']

      const getData = async () => {
        if (filters) {
          setFetching(true)

          if (!fetchTrigger) {
            setData(null)
          }

          setData(
            Object.fromEntries(
              await Promise.all(
                toArray(
                  metrics.map(m =>
                    new Promise(
                      async resolve => {
                        switch (m) {
                          case 'GMPStats':
                            resolve([m, await GMPStats({ ...filters })])
                            break
                          case 'GMPStatsAVGTimes':
                            resolve([m, await GMPStats({ ...filters, avg_times: true })])
                            break
                          case 'GMPChart':
                            resolve([m, await GMPChart({ ...filters, granularity })])
                            break
                          case 'GMPTotalVolume':
                            resolve([m, await GMPTotalVolume({ ...filters })])
                            break
                          case 'transfersStats':
                            resolve([m, await transfersStats({ ...filters })])
                            break
                          case 'transfersChart':
                            resolve([m, await transfersChart({ ...filters, granularity })])
                            break
                          case 'transfersTotalVolume':
                            resolve([m, await transfersTotalVolume({ ...filters })])
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
          setFetching(false)
        }
      }
      getData()
    },
    [fetchTrigger],
  )

  const {
    fromTime,
    toTime,
  } = { ...filters }

  const granularity = getGranularity(fromTime, toTime)

  return (
    <div>
      {data ?
        <div className="space-y-6">
          <Summary data={data} filters={filters} />
          <Charts data={data} granularity={granularity} />
          <Tops data={data} />
        </div> :
        <div className="loading-in-tab">
          <Spinner name="Blocks" />
        </div>
      }
    </div>
  )
}