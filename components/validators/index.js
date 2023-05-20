import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Chip, Tabs, TabsHeader, TabsBody, Tab, TabPanel, Tooltip } from '@material-tailwind/react'
import _ from 'lodash'

import Spinner from '../spinner'
import Datatable from '../datatable'
import NumberDisplay from '../number'
import Image from '../image'
import Copy from '../copy'
import ValidatorProfile from '../profile/validator'
import { getInflation } from '../../lib/api/axelar'
import { getChainData } from '../../lib/config'
import { toArray, includesStringList, ellipse, equalsIgnoreCase, fixDecimals } from '../../lib/utils'

const PAGE_SIZE = 100
const STATUSES = ['active', 'inactive']

export default () => {
  const {
    chains,
    assets,
    chain,
    validators,
    maintainers,
  } = useSelector(
    state => (
      {
        chains: state.chains,
        assets: state.assets,
        chain: state.chain,
        validators: state.validators,
        maintainers: state.maintainers,
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
  const {
    chain_data,
  } = { ...chain }
  const {
    validators_data,
  } = { ...validators }
  const {
    maintainers_data,
  } = { ...maintainers }

  const router = useRouter()
  const {
    pathname,
    query,
  } = { ...router }

  const [status, setStatus] = useState(query.status || _.head(STATUSES))
  const [inflationData, setInflationData] = useState(null)
  const [data, setData] = useState(null)

  useEffect(
    () => {
      switch (pathname) {
        case '/validators':
          if (status && status !== _.head(STATUSES)) {
            router.push(`/validators/${status}`)
          }
          break
        default:
          if (status) {
            router.push(`/validators${status !== _.head(STATUSES) ? `/${status}` : ''}`)
          }
          break
      }
    },
    [pathname, status],
  )

  useEffect(
    () => {
      const getData = async () => setInflationData(await getInflation())
      getData()
    },
    [],
  )

  useEffect(
    () => {
      const {
        staking_pool,
        bank_supply,
      } = { ...chain_data }

      if (validators_data && maintainers_data && staking_pool && bank_supply && inflationData) {
        const {
          bonded_tokens,
        } = { ...staking_pool }

        const total_supply = bank_supply.amount;

        const {
          tendermintInflationRate,
          keyMgmtRelativeInflationRate,
          externalChainVotingInflationRate,
          communityTax,
        } = { ...inflationData }

        setData(
          _.orderBy(
            validators_data.map(v => {
              const {
                operator_address,
                commission,
                uptime,
                heartbeats_uptime,
                votes,
              } = { ...v }

              const {
                rate,
              } = { ...commission?.commission_rates }

              const supported_chains = Object.entries(maintainers_data).filter(([k, _v]) => _v.includes(operator_address)).map(([k, _v]) => k)
              const inflation = fixDecimals(
                ((uptime / 100) * (tendermintInflationRate || 0)) +
                ((heartbeats_uptime / 100) * (keyMgmtRelativeInflationRate || 0) * (tendermintInflationRate || 0)) +
                (
                  (externalChainVotingInflationRate || 0) *
                  _.sum(
                    supported_chains.map(c => {
                      const {
                        total,
                        total_polls,
                      } = { ...votes?.chains?.[c] }

                      return 1 - (total_polls ? (total_polls - total) / total_polls : 0)
                    })
                  )
                ),
                6,
              )

              return {
                ...v,
                inflation,
                apr: (inflation * 100) * total_supply * (1 - (communityTax || 0)) * (1 - (rate || 0)) / bonded_tokens,
                supported_chains,
                votes: votes && { ...votes, chains: Object.fromEntries(Object.entries({ ...votes.chains }).filter(([k, v]) => supported_chains.includes(k))) },
              }
            }),
            ['quadratic_voting_power', 'tokens'], ['desc', 'desc'],
          )
        )
      }
    },
    [validators_data, maintainers_data, inflationData],
  )

  const filterByStatus = status => toArray(data || validators_data).filter(v => status === 'inactive' ? v.status !== 'BOND_STATUS_BONDED' : v.status === 'BOND_STATUS_BONDED' && !v.jailed)

  const render = status => {
    const _data = filterByStatus(status)
    return (
      <Datatable
        columns={[
          {
            Header: '#',
            accessor: 'i',
            disableSortBy: true,
            Cell: props => (
              <span className="text-black dark:text-white font-medium">
                {props.flatRows?.indexOf(props.row) + 1}
              </span>
            ),
          },
          {
            Header: 'Validator',
            accessor: 'operator_address',
            sortType: (a, b) => a.original.description?.moniker > b.original.description?.moniker ? 1 : -1,
            Cell: props => {
              const {
                value,
                row,
              } = { ...props }

              const {
                description,
              } = { ...row.original }

              const {
                moniker,
              } = { ...description }

              return (
                description ?
                  <div className="min-w-max flex items-start space-x-2">
                    <Link
                      href={`/validator/${value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ValidatorProfile description={description} />
                    </Link>
                    <div className="flex flex-col">
                      <Link
                        href={`/validator/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm font-medium"
                      >
                        {ellipse(moniker, 16)}
                      </Link>
                      <div className="flex items-center space-x-1">
                        <Link
                          href={`/validator/${value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 dark:text-slate-500 text-sm"
                        >
                          {ellipse(value, 6, 'axelarvaloper')}
                        </Link>
                        <Copy value={value} />
                      </div>
                    </div>
                  </div> :
                  value ?
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/validator/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm font-medium"
                      >
                        {ellipse(value, 6, 'axelarvaloper')}
                      </Link>
                      <Copy value={value} />
                    </div> :
                    '-'
              )
            },
          },
          {
            Header: (
              <div className="flex flex-col items-center space-y-0.5">
                <span>
                  Voting Power
                </span>
                <div className="w-32 grid grid-cols-2 gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-3xs font-medium">
                    Consensus
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-3xs font-medium">
                    Quadratic
                  </span>
                </div>
              </div>
            ),
            accessor: 'voting_power',
            sortType: (a, b) => a.original.quadratic_voting_power > b.original.quadratic_voting_power ? 1 : a.original.quadratic_voting_power < b.original.quadratic_voting_power ? -1 : a.original.tokens > b.original.tokens ? 1 : -1,
            Cell: props => {
              const {
                tokens,
                quadratic_voting_power,
              } = { ...props.row.original }

              const total_voting_power = _.sumBy(filterByStatus('active'), 'tokens')
              const total_quadratic_voting_power = _.sumBy(filterByStatus('active'), 'quadratic_voting_power')

              return (
                <div className="w-32 grid grid-cols-2 gap-2 sm:ml-auto">
                  <div className="flex flex-col items-center text-center">
                    <NumberDisplay
                      value={tokens}
                      format="0,0.0a"
                      noTooltip={true}
                      className="text-black dark:text-white text-xs lg:text-sm font-medium"
                    />
                    <NumberDisplay
                      value={tokens * 100 / total_voting_power}
                      format="0,0.00"
                      maxDecimals={2}
                      suffix="%"
                      noTooltip={true}
                      className="text-slate-400 dark:text-slate-500 text-2xs lg:text-xs"
                    />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <NumberDisplay
                      value={quadratic_voting_power}
                      format="0,0.0a"
                      noTooltip={true}
                      className="text-black dark:text-white text-xs lg:text-sm font-medium"
                    />
                    <NumberDisplay
                      value={quadratic_voting_power * 100 / total_quadratic_voting_power}
                      format="0,0.00"
                      maxDecimals={2}
                      suffix="%"
                      noTooltip={true}
                      className="text-slate-400 dark:text-slate-500 text-2xs lg:text-xs"
                    />
                  </div>
                </div>
              )
            },
            headerClassName: 'whitespace-nowrap justify-start sm:justify-end text-left sm:text-right',
          },
          {
            Header: status === 'inactive' ? 'Staked Tokens' : 'Consensus Power',
            accessor: 'tokens',
            sortType: (a, b) => a.original.tokens > b.original.tokens ? 1 : -1,
            Cell: props => {
              const {
                value,
              } = { ...props }

              const total_voting_power = _.sumBy(filterByStatus('active'), 'tokens')

              return (
                <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                  <NumberDisplay
                    value={value}
                    format="0,0.0a"
                    noTooltip={true}
                    className="text-black dark:text-white text-xs lg:text-sm font-medium"
                  />
                  <NumberDisplay
                    value={value * 100 / total_voting_power}
                    format="0,0.00"
                    maxDecimals={2}
                    suffix="%"
                    noTooltip={true}
                    className="text-slate-400 dark:text-slate-500 text-2xs lg:text-xs"
                  />
                </div>
              )
            },
            headerClassName: 'whitespace-nowrap justify-start sm:justify-end text-left sm:text-right',
          },
          {
            Header: 'Commission',
            accessor: 'commission.commission_rates.rate',
            sortType: (a, b) => Number(a.original.commission?.commission_rates?.rate) > Number(b.original.commission?.commission_rates?.rate) ? 1 : -1,
            Cell: props => (
              <div className="leading-3 text-left sm:text-right">
                <NumberDisplay
                  value={props.value * 100}
                  format="0,0.0"
                  maxDecimals={2}
                  suffix="%"
                  noTooltip={true}
                  className="text-black dark:text-white text-sm font-medium"
                />
              </div>
            ),
            headerClassName: 'whitespace-nowrap justify-start sm:justify-end text-left sm:text-right',
          },
          {
            Header: (
              <Tooltip content="Approximate staking APR per validator">
                <span>APR</span>
              </Tooltip>
            ),
            accessor: 'apr',
            sortType: (a, b) => a.original.apr > b.original.apr ? 1 : -1,
            Cell: props => {
              const {
                value,
                row,
              } = { ...props }

              const {
                inflation,
              } = { ...row.original }

              return inflation > 0 && (
                <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                  <NumberDisplay
                    value={value}
                    format="0,0.0"
                    maxDecimals={1}
                    suffix="%"
                    noTooltip={true}
                    className="text-black dark:text-white text-xs lg:text-sm font-medium"
                  />
                  <Tooltip placement="bottom" content="Inflation">
                    <div className="leading-3">
                      <NumberDisplay
                        value={inflation * 100}
                        format="0,0.00"
                        maxDecimals={2}
                        suffix="%"
                        noTooltip={true}
                        className="text-slate-400 dark:text-slate-500 text-2xs lg:text-xs"
                      />
                    </div>
                  </Tooltip>
                </div>
              )
            },
            headerClassName: 'whitespace-nowrap justify-start sm:justify-end text-left sm:text-right',
          },
          {
            Header: 'EVM Chains Supported',
            accessor: 'supported_chains',
            sortType: (a, b) => toArray(a.original.supported_chains).length > toArray(b.original.supported_chains).length ? 1 : -1,
            Cell: props => {
              const {
                value,
              } = { ...props }

              return (
                <div className="max-w-fit flex flex-wrap items-center">
                  {maintainers_data && data ?
                    toArray(value).length > 0 ?
                      _.orderBy(toArray(value).map(c => getChainData(c, chains_data)), ['i'], ['asc']).map((c, i) => {
                        const {
                          name,
                          image,
                        } = { ...c }

                        return (
                          <div key={i} className="mb-1 mr-1">
                            <Tooltip content={name}>
                              <div className="w-fit">
                                <Image
                                  src={image}
                                  width={20}
                                  height={20}
                                  className="3xl:w-6 3xl:h-6 rounded-full"
                                />
                              </div>
                            </Tooltip>
                          </div>
                        )
                      }) :
                      '-' :
                    <Spinner name="ProgressBar" />
                  }
                </div>
              )
            },
            headerClassName: 'whitespace-nowrap',
          },
          {
            Header: 'Status',
            accessor: 'status',
            sortType: (a, b) => a.original.tombstoned > b.original.tombstoned ? -1 : a.original.tombstoned < b.original.tombstoned ? 1 : a.original.jailed > b.original.jailed ? -1 : a.original.jailed < b.original.jailed ? 1 : a.original.status > b.original.status ? 1 : a.original.status < b.original.status ? -1 : -1,
            Cell: props => {
              const {
                value,
                row,
              } = { ...props }

              const {
                tombstoned,
                jailed,
              } = { ...row.original }

              return (
                <div className="flex flex-col items-start sm:items-end text-left sm:text-right space-y-1">
                  {value ?
                    <>
                      <Chip
                        color={value.includes('UN') ? value.endsWith('ED') ? 'red' : 'yellow' : 'green'}
                        value={value.replace('BOND_STATUS_', '')}
                        className="rounded select-auto normal-case custom-font text-xs font-medium py-1 px-2.5"
                      />
                      {tombstoned && (
                        <Chip
                          color="cyan"
                          value="Tombstoned"
                          className="rounded select-auto normal-case custom-font text-xs font-medium py-1 px-2.5"
                        />
                      )}
                      {jailed && (
                        <Chip
                          color="cyan"
                          value="Jailed"
                          className="rounded select-auto normal-case custom-font text-xs font-medium py-1 px-2.5"
                        />
                      )}
                    </> :
                    '-'
                  }
                </div>
              )
            },
            headerClassName: 'justify-start sm:justify-end text-left sm:text-right',
          },
        ]
        .filter(c => status === 'inactive' ? !['voting_power', 'cumulative_share', 'quadratic_cumulative_share', 'apr'].includes(c.accessor) : !['tokens', 'status'].includes(c.accessor))}
        data={_data}
        defaultPageSize={PAGE_SIZE}
        noPagination={_data.length <= PAGE_SIZE}
        className="no-border no-shadow"
      />
    )
  }

  return status && (
    <div className="children">
      {data ?
        <Tabs value={status} className="tabs pt-8 px-2 sm:px-4">
          <TabsHeader className="max-w-xs">
            {STATUSES.map(s => (
              <Tab
                key={s}
                value={s}
                onClick={() => setStatus(s)}
                className="capitalize"
              >
                {s} ({filterByStatus(s).length})
              </Tab>
            ))}
          </TabsHeader>
          <TabsBody>
            {STATUSES.map(s => (
              <TabPanel
                key={s}
                value={s}
              >
                {render(s)}
              </TabPanel>
            ))}
          </TabsBody>
        </Tabs> :
        <div className="loading">
          <Spinner name="Blocks" />
        </div>
      }
    </div>
  )
}