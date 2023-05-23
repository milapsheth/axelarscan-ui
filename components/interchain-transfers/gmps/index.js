import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Tooltip } from '@material-tailwind/react'
import _ from 'lodash'
import moment from 'moment'

import Spinner from '../../spinner'
import Datatable from '../../datatable'
import NumberDisplay from '../../number'
import Image from '../../image'
import Copy from '../../copy'
import AccountProfile from '../../profile/account'
import ExplorerLink from '../../explorer/link'
import TimeAgo from '../../time/timeAgo'
import { searchGMP } from '../../../lib/api/gmp'
import { getChainData, getAssetData } from '../../../lib/config'
import { toArray, getTitle, ellipse, equalsIgnoreCase, getQueryParams } from '../../../lib/utils'

const PAGE_SIZE = 25

export default () => {
  const {
    chains,
    assets,
  } = useSelector(
    state => (
      {
        chains: state.chains,
        assets: state.assets,
      }
    ),
    shallowEqual,
  )
  const {
    chains_data,
  } = { ...chains }
  const {
    assets_data,
  } = { ...assets }

  const router = useRouter()
  const {
    pathname,
    asPath,
  } = { ...router }

  const [data, setData] = useState(null)
  const [total, setTotal] = useState(null)
  const [offset, setOffet] = useState(0)
  const [filters, setFilters] = useState(null)
  const [fetchTrigger, setFetchTrigger] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [types, setTypes] = useState(null)
  const [typesFiltered, setTypesFiltered] = useState(null)

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
        if (pathname && filters) {
          setFetchTrigger(is_interval ? moment().valueOf() : typeof fetchTrigger === 'number' ? null : 0)
        }
      }

      trigger()
      const interval = setInterval(() => trigger(true), 15 * 1000)
      return () => clearInterval(interval)
    },
    [pathname, filters],
  )

  useEffect(
    () => {
      const getData = async () => {
        if (filters) {
          setFetching(true)

          if (!fetchTrigger) {
            setData(null)
            setTotal(null)
            setOffet(0)
          }

          const _data = toArray(fetchTrigger && data)
          const size = PAGE_SIZE
          const from = [true, 1].includes(fetchTrigger) ? _data.length : 0
          const response = await searchGMP({ ...filters, size, from })

          if (response) {
            const {
              total,
            } = { ...response }
            let {
              data,
            } = { ...response }

            setTotal(total)
            data = _.orderBy(_.uniqBy(_.concat(toArray(data), _data), 'id'), ['call.block_timestamp'], ['desc'])
            setData(data)
          }
          else if (!fetchTrigger) {
            setData([])
            setTotal(0)
          }

          setFetching(false)
        }
      }
      getData()
    },
    [fetchTrigger],
  )

  useEffect(
    () => {
      if (data) {
        setTypes(_.countBy(toArray(_.uniqBy(data, 'id').map(d => normalizeEvent(d.call?.event)))))
      }
    },
    [data],
  )

  const normalizeEvent = event => event?.replace('ContractCall', 'callContract')
  const dataFiltered = toArray(data).filter(d => toArray(typesFiltered).length < 1 || typesFiltered.includes(normalizeEvent(d.call?.event)))

  return (
    <div>
      {data ?
        <div className="space-y-2 sm:space-y-4 mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 space-x-0 sm:space-x-3">
            <div className="space-y-0.5">
              {typeof total === 'number' && (
                <NumberDisplay
                  value={total}
                  format="0,0"
                  suffix=" Results"
                  className="whitespace-nowrap text-slate-500 dark:text-slate-200 font-normal"
                />
              )}
            </div>
            <div className="flex flex-col sm:items-end space-y-1">
              <div className="overflow-x-auto flex flex-wrap items-center justify-start sm:justify-end">
                {Object.entries({ ...types }).map(([k, v]) => (
                  <div
                    key={k}
                    onClick={() => setTypesFiltered(_.uniq(toArray(typesFiltered).includes(k) ? typesFiltered.filter(t => !equalsIgnoreCase(t, k)) : _.concat(toArray(typesFiltered), k)))}
                    className={`min-w-max ${toArray(typesFiltered).includes(k) ? 'text-blue-500 dark:text-slate-200 font-semibold' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-normal'} cursor-pointer whitespace-nowrap flex items-center text-xs sm:text-sm space-x-1 sm:ml-3 mr-3 sm:mr-0`}
                  >
                    <span>{k}</span>
                    <NumberDisplay
                      value={v}
                      format="0,0"
                      className="text-blue-500 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Datatable
            columns={[
              {
                Header: 'Tx Hash',
                accessor: 'call.transactionHash',
                disableSortBy: true,
                Cell: props => {
                  const {
                    value,
                    row,
                  } = { ...props }

                  const {
                    call,
                  } = { ...row.original }

                  const {
                    logIndex,
                    chain,
                  } = { ...call }

                  const {
                    explorer,
                  } = { ...getChainData(chain, chains_data) }

                  return value && (
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/gmp/${value}${typeof logIndex === 'number' ? `:${logIndex}` : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 dark:text-blue-500 text-sm font-medium"
                      >
                        {ellipse(value, 10)}
                      </Link>
                      <Copy value={value} />
                      <ExplorerLink value={value} explorer={explorer} />
                    </div>
                  )
                },
              },
              {
                Header: 'Method',
                accessor: 'call.event',
                disableSortBy: true,
                Cell: props => {
                  const {
                    value,
                    row,
                  } = { ...props }

                  const {
                    call,
                    amount,
                  } = { ...row.original }

                  const {
                    symbol,
                  } = { ...call?.returnValues }

                  const {
                    image,
                  } = { ...getAssetData(symbol, assets_data) }

                  return (
                    <div className="w-44 flex flex-col text-slate-600 dark:text-slate-200 text-sm space-y-1 mb-4">
                      <div className="w-fit h-6 bg-slate-50 dark:bg-slate-900 rounded flex items-center font-medium py-1 px-2">
                        {normalizeEvent(value)}
                      </div>
                      <div className="h-6 flex items-center space-x-2">
                        {image && (
                          <Image
                            src={image}
                            width={24}
                            height={24}
                          />
                        )}
                        {typeof amount === 'number' && (
                          <NumberDisplay
                            value={amount}
                            format="0,0.00"
                            suffix={` ${symbol}`}
                          />
                        )}
                      </div>
                    </div>
                  )
                },
              },
              {
                Header: 'Source',
                accessor: 'call.chain',
                disableSortBy: true,
                Cell: props => {
                  const {
                    value,
                    row,
                  } = { ...props }

                  const {
                    call,
                  } = { ...row.original }

                  const {
                    from,
                  } = { ...call?.transaction }

                  const {
                    name,
                    image,
                    explorer,
                  } = { ...getChainData(value, chains_data) }

                  return (
                    <div className="w-60 flex flex-col text-slate-600 dark:text-slate-200 text-sm space-y-1 mb-4">
                      <div className="h-6 flex items-center space-x-2">
                        {image && (
                          <Image
                            src={image}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span className="font-medium">
                          {name || getTitle(value)}
                        </span>
                      </div>
                      <div className="h-6 flex items-center">
                        <AccountProfile address={from} noCopy={true} explorer={explorer} />
                      </div>
                    </div>
                  )
                },
              },
              {
                Header: 'Destination',
                accessor: 'call.returnValues.destinationChain',
                disableSortBy: true,
                Cell: props => {
                  const {
                    value,
                    row,
                  } = { ...props }

                  const {
                    call,
                  } = { ...row.original }

                  const {
                    destinationContractAddress,
                  } = { ...call?.returnValues }

                  const {
                    name,
                    image,
                    explorer,
                  } = { ...getChainData(value, chains_data) }

                  return (
                    <div className="w-60 flex flex-col text-slate-600 dark:text-slate-200 text-sm space-y-1 mb-4">
                      <div className="h-6 flex items-center space-x-2">
                        {image && (
                          <Image
                            src={image}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <span className="font-medium">
                          {name || getTitle(value)}
                        </span>
                      </div>
                      <div className="h-6 flex items-center">
                        <AccountProfile address={destinationContractAddress} noCopy={true} explorer={explorer} />
                      </div>
                    </div>
                  )
                },
              },
              {
                Header: 'Status',
                accessor: 'status',
                disableSortBy: true,
                Cell: props => {
                  return (
                    <div className="w-40 flex flex-col text-slate-600 dark:text-slate-200 text-sm space-y-1 mb-4">
                    </div>
                  )
                }
              },
              {
                Header: 'Created at',
                accessor: 'call.block_timestamp',
                disableSortBy: true,
                Cell: props => props.value && (
                  <div className="flex justify-end">
                    <TimeAgo time={moment(props.value * 1000).unix()} className="text-slate-400 dark:text-slate-500 text-sm font-medium" />
                  </div>
                ),
                headerClassName: 'justify-end text-right',
              },
            ]}
            data={dataFiltered}
            defaultPageSize={PAGE_SIZE}
            noPagination={dataFiltered.length <= 10}
            className="no-border no-shadow"
          />
          {data.length >= PAGE_SIZE && (typeof total !== 'number' || data.length < total) && (
            <div className="flex justify-center">
              {!fetching ?
                <button
                  onClick={
                    () => {
                      setOffet(data.length)
                      setFetchTrigger(typeof fetchTrigger === 'number' ? true : 1)
                    }
                  }
                  className="btn btn-default bg-blue-400 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 shadow rounded text-white"
                >
                  Load more
                </button> :
                <Spinner name="ProgressBar" width={36} height={36} />
              }
            </div>
          )}
        </div> :
        <div className="loading-in-tab">
          <Spinner name="Blocks" />
        </div>
      }
    </div>
  )
}