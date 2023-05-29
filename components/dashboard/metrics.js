import Link from 'next/link'
import { Card, CardBody, CardFooter, Tooltip } from '@material-tailwind/react'
import _ from 'lodash'
import moment from 'moment'

import NetworkGraph from './network-graph'
import Spinner from '../spinner'
import NumberDisplay from '../number'
import Image from '../image'
import { toArray, numberFormat } from '../../lib/utils'

const METRICS = ['block', 'avg_block_time', 'validators', 'staked', 'apr', 'inflation']
const INTERCHAIN_METRICS = ['transactions', 'volumes', 'contracts', 'chains']
const DATE_FORMAT = 'MMM D, YYYY h:mm:ss A z'

const Detail = ({ title, children }) => {
  return (
    <div className="flex flex-col">
      <span className="whitespace-nowrap text-xs">
        {title}
      </span>
      {children}
    </div>
  )
}

export default ({ data }) => {
  const {
    block_data,
    validators_data,
    token_data,
    inflation_data,
    GMPStats,
    GMPTotalVolume,
    transfersStats,
    transfersTotalVolume,
    networkGraph,
    chains_data,
  } = { ...data }

  const {
    latest_block_height,
    latest_block_time,
    avg_block_time,
  } = { ...block_data }

  const {
    active,
    total,
  } = { ...validators_data }

  const {
    symbol,
    staked,
    total_supply,
  } = { ...token_data }

  const {
    communityTax,
    inflation,
  } = { ...inflation_data }

  const {
    messages,
  } = { ...GMPStats }

  const render = id => {
    const valueClassName = 'text-black dark:text-white text-3xl lg:text-2xl 2xl:text-3xl font-medium'
    const titleClassName = 'whitespace-nowrap text-blue-400 dark:text-blue-500 text-base'

    let gmp
    let transfers
    let total_transfers

    let title
    let url
    let loading
    let tooltip
    let component

    switch (id) {
      case 'block':
        title = 'Latest block'
        url = `/block${latest_block_height ? `/${latest_block_height}` : 's'}`
        loading = !block_data
        tooltip = moment(latest_block_time).format(DATE_FORMAT)
        component = (
          <div>
            <NumberDisplay
              value={latest_block_height}
              format="0,0"
              className={valueClassName}
            />
          </div>
        )
        break
      case 'avg_block_time':
        title = 'Avg. block time'
        url = '/blocks'
        loading = !block_data
        tooltip = 'The average block time from the last 100 blocks'
        component = (
          <div>
            <NumberDisplay
              value={avg_block_time}
              format="0,0.00"
              suffix=" sec"
              className={valueClassName}
            />
          </div>
        )
        break
      case 'validators':
        title = 'Validators'
        url = '/validators'
        loading = !validators_data
        tooltip = `${active} active validators out of ${total}`
        component = (
          <div>
            <NumberDisplay
              value={active}
              format="0,0"
              className={valueClassName}
            />
          </div>
        )
        break
      case 'staked':
        title = 'Staked tokens'
        url = '/validators'
        loading = !token_data
        tooltip = `${numberFormat(staked * 100 / total_supply, '0,0.00')}% staked tokens from ${numberFormat(total_supply, '0,0.00a')} ${symbol}`
        component = (
          <div className={valueClassName}>
            <NumberDisplay
              value={staked}
              format="0,0a"
              noTooltip={true}
              className={valueClassName}
            />
            /
            <NumberDisplay
              value={total_supply}
              format="0,0a"
              noTooltip={true}
              className={valueClassName}
            />
          </div>
        )
        break
      case 'apr':
        title = 'Staking APR'
        url = 'https://wallet.keplr.app/chains/axelar'
        loading = !(token_data && inflation_data)
        tooltip = 'Annual Percentage Rate (APR): % inflation * total supply * (1 - community tax) * (1 - commission rate) / staked tokens'
        component = (
          <div>
            <NumberDisplay
              value={(inflation * 100) * total_supply * (1 - communityTax) * (1 - 0.05) / staked}
              format="0,0.00"
              suffix="%"
              noTooltip={true}
              className={valueClassName}
            />
          </div>
        )
        break
      case 'inflation':
        title = 'Inflation'
        url = '/validators'
        loading = !inflation_data
        tooltip = '% network inflation + (inflation for EVM chains * # EVM chains)'
        component = (
          <div>
            <NumberDisplay
              value={inflation * 100}
              format="0,0.00"
              suffix="%"
              noTooltip={true}
              className={valueClassName}
            />
          </div>
        )
        break
      case 'transactions':
        gmp = _.sumBy(messages, 'num_txs') || 0
        transfers = transfersStats?.total || 0
        total_transfers = gmp + transfers
        title = 'Transactions'
        url = '/interchain-transfers'
        loading = !GMPStats
        tooltip = (
          <div className="grid grid-cols-2 gap-4">
            <Detail title="GMP">
              <NumberDisplay
                value={gmp}
                format="0,0"
                className="font-normal"
              />
            </Detail>
            <Detail title="TRANSFERS">
              <NumberDisplay
                value={transfers}
                format="0,0"
                className="font-normal"
              />
            </Detail>
          </div>
        )
        component = (
          <div>
            <NumberDisplay
              value={total_transfers}
              format="0,0"
              className={valueClassName}
            />
          </div>
        )
        break
      case 'volumes':
        gmp = GMPTotalVolume || 0
        transfers = transfersTotalVolume || 0
        total_transfers = gmp + transfers
        title = 'Volumes'
        url = '/interchain-transfers'
        loading = !(GMPTotalVolume || transfersTotalVolume)
        tooltip = (
          <div className="grid grid-cols-2 gap-4">
            <Detail title="GMP">
              <NumberDisplay
                value={gmp}
                format="0,0"
                prefix="$"
                noTooltip={true}
                className="font-normal"
              />
            </Detail>
            <Detail title="TRANSFERS">
              <NumberDisplay
                value={transfers}
                format="0,0"
                prefix="$"
                noTooltip={true}
                className="font-normal"
              />
            </Detail>
          </div>
        )
        component = (
          <div>
            <NumberDisplay
              value={total_transfers}
              format="0,0.00a"
              prefix="$"
              noTooltip={true}
              className={`sm:hidden ${valueClassName}`}
            />
            <NumberDisplay
              value={total_transfers}
              format="0,0"
              prefix="$"
              noTooltip={true}
              className={`hidden sm:block ${valueClassName}`}
            />
          </div>
        )
        break
      case 'contracts':
        const contracts =
          Object.entries(
            _.groupBy(
              toArray(messages).flatMap(m =>
                toArray(m.source_chains).flatMap(s =>
                  toArray(s.destination_chains).flatMap(d =>
                    toArray(d.contracts).map(c => {
                      return {
                        chain: d.key,
                        address: c.key.toLowerCase(),
                      }
                    })
                  )
                )
              ),
              'address',
            )
          )
          .map(([k, v]) => {
            return {
              address: k,
              chains: _.uniq(v.map(_v => _v.chain)),
            }
          })
        title = 'GMP Contracts'
        url = '/interchain-transfers'
        loading = !GMPStats
        tooltip = 'Total GMP Contracts'
        component = (
          <div>
            <NumberDisplay
              value={contracts.length}
              format="0,0"
              className={valueClassName}
            />
          </div>
        )
        break
      case 'chains':
        const chains = toArray(chains_data).filter(c => !c.deprecated && (!c.maintainer_id || !c.no_inflation || c.gateway_address))
        title = 'Connected Chains'
        url = '/interchain-transfers'
        loading = !chains_data
        tooltip = (
          <div className="w-64 flex flex-wrap items-center mt-1">
            {chains.map((c, i) => {
              const {
                name,
                image,
              } = { ...c }

              return (
                <div key={i} className="mb-1 mr-1">
                  <Tooltip content={name}>
                    <div>
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
            })}
          </div>
        )
        component = (
          <div>
            <NumberDisplay
              value={chains.length}
              format="0,0"
              className={valueClassName}
            />
          </div>
        )
        break
      default:
        break
    }

    return (
      <Link key={id} href={url}>
        <Card className="card">
          <CardBody className="mt-0.5 pt-4 2xl:pt-6 pb-1 2xl:pb-2 px-4 2xl:px-6">
            {!loading ?
              tooltip ?
                <Tooltip placement="top-start" content={tooltip}>
                  {component}
                </Tooltip> :
                component :
              <Spinner name="ProgressBar" width={36} height={36} />
            }
          </CardBody>
          <CardFooter className="card-footer pb-4 2xl:pb-6 px-4 2xl:px-6">
            <span className={titleClassName}>
              {title}
            </span>
          </CardFooter>
        </Card>
      </Link>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span className="uppercase text-base font-medium">
            Axelar Network Status
          </span>
          <div className="flex items-center justify-between sm:justify-end">
            {process.env.NEXT_PUBLIC_TOKEN_INFO_URL && (
              <a
                href={process.env.NEXT_PUBLIC_TOKEN_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 mr-4"
              >
                <div className="min-w-fit">
                  <div className="block dark:hidden">
                    <Image
                      src="/logos/logo.png"
                      width={14}
                      height={14}
                    />
                  </div>
                  <div className="hidden dark:block">
                    <Image
                      src="/logos/logo_white.png"
                      width={14}
                      height={14}
                    />
                  </div>
                </div>
                <span className="whitespace-nowrap text-blue-400 dark:text-blue-500">
                  AXL token info guides
                </span>
              </a>
            )}
            {process.env.NEXT_PUBLIC_WEBSITE_URL && (
              <a
                href={process.env.NEXT_PUBLIC_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-blue-400 dark:text-blue-500"
              >
                Learn more about Axelar
              </a>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {METRICS.map(m => render(m))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span className="uppercase text-base font-medium">
            Interchain Transfers
          </span>
        </div>
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
            {INTERCHAIN_METRICS.map(m => render(m))}
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <NetworkGraph data={networkGraph} />
          </div>
        </div>
      </div>
    </>
  )
}