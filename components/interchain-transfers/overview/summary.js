import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Card, CardBody, CardFooter, Tooltip } from '@material-tailwind/react'
import _ from 'lodash'
import moment from 'lodash'

import NumberDisplay from '../../number'
import Image from '../../image'
import AccountProfile from '../../profile/account'
import { toArray, getTitle, createMomentFromUnixtime } from '../../../lib/utils'

const TIME_FORMAT = 'MMM D, YYYY'
const METRICS = ['transactions', 'volumes', 'methods', 'contracts']
const NUM_CHAINS_TRUNCATE = 7

const Detail = ({ title, children }) => {
  return (
    <div className="flex flex-col">
      <span className="whitespace-nowrap text-slate-400 dark:text-slate-500 text-xs">
        {title}
      </span>
      {children}
    </div>
  )
}

export default ({ data, filters }) => {
  const {
    chains,
  } = useSelector(state => ({ chains: state.chains }), shallowEqual)
  const {
    chains_data,
  } = { ...chains }

  const [seeMoreChain, setSeeMoreChain] = useState(false)

  const {
    GMPStats,
    GMPTotalVolume,
    transfersStats,
    transfersTotalVolume,
  } = { ...data }

  const {
    contractAddress,
    fromTime,
    toTime,
  } = { ...filters }

  const {
    messages,
  } = { ...GMPStats }

  const {
    types,
  } = { ...transfersStats }

  const normalizeEvent = event => event?.replace('ContractCall', 'callContract')
  const normalizeType = type => ['wrap', 'unwrap', 'erc20_transfer'].includes(type) ? 'deposit_service' : type || 'deposit_address'

  const render = metric => {
    const valueClassName = 'text-black dark:text-white text-4xl lg:text-3xl 2xl:text-4xl font-medium'
    const titleClassName = 'whitespace-nowrap text-blue-400 dark:text-blue-500 text-base'

    let gmp
    let transfers
    let total

    switch (metric) {
      case 'transactions':
        gmp = _.sumBy(messages, 'num_txs') || 0
        transfers = transfersStats?.total || 0
        total = gmp + transfers

        return (
          <Card key={metric} className="card">
            <CardBody className="mt-1 pb-2">
              <NumberDisplay
                value={total}
                format="0,0"
                className={valueClassName}
              />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Detail title="GMP">
                  <NumberDisplay
                    value={gmp}
                    format="0,0"
                    className="text-slate-600 dark:text-slate-200 font-medium"
                  />
                </Detail>
                <Detail title="TRANSFERS">
                  <NumberDisplay
                    value={transfers}
                    format="0,0"
                    className="text-slate-600 dark:text-slate-200 font-medium"
                  />
                </Detail>
              </div>
            </CardBody>
            <CardFooter className="card-footer">
              <span className={titleClassName}>
                Transactions
              </span>
            </CardFooter>
          </Card>
        )
      case 'volumes':
        gmp = GMPTotalVolume || 0
        transfers = transfersTotalVolume || 0
        total = gmp + transfers

        return (
          <Card key={metric} className="card">
            <CardBody className="mt-1 pb-2">
              <NumberDisplay
                value={total}
                format="0,0"
                prefix="$"
                noTooltip={true}
                className={valueClassName}
              />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Detail title="GMP">
                  <NumberDisplay
                    value={gmp}
                    format="0,0.00a"
                    prefix="$"
                    noTooltip={true}
                    className="text-slate-600 dark:text-slate-200 font-medium"
                  />
                </Detail>
                <Detail title="TRANSFERS">
                  <NumberDisplay
                    value={transfers}
                    format="0,0.00a"
                    prefix="$"
                    noTooltip={true}
                    className="text-slate-600 dark:text-slate-200 font-medium"
                  />
                </Detail>
              </div>
            </CardBody>
            <CardFooter className="card-footer">
              <span className={titleClassName}>
                Volumes
              </span>
            </CardFooter>
          </Card>
        )
      case 'methods':
        const gmpMethods = _.orderBy(toArray(messages).map(d => { return { ...d, key: normalizeEvent(d.key) } }), ['key'], ['asc'])
        const transfersMethods = _.orderBy(
          Object.entries(_.groupBy(toArray(types).map(d => { return { ...d, key: normalizeType(d.key) } }), 'key')).map(([k, v]) => {
            return {
              key: k,
              num_txs: _.sumBy(v, 'num_txs'),
            }
          }),
          ['key'], ['asc'],
        )

        return (
          <Card key={metric} className="card">
            <CardBody className="space-y-1.5 mt-1 pb-2">
              {gmpMethods.length > 0 && (
                <div className="grid grid-cols-2 2xl:grid-cols-3 gap-y-1.5 gap-x-4">
                  {gmpMethods.map((d, i) => (
                    <Detail key={i} title={getTitle(d.key)}>
                      <NumberDisplay
                        value={d.num_txs}
                        format="0,0"
                        className="text-slate-600 dark:text-slate-200 font-medium"
                      />
                    </Detail>
                  ))}
                </div>
              )}
              {transfersMethods.length > 0 && (
                <div className="grid grid-cols-2 2xl:grid-cols-3 gap-y-1.5 gap-x-4">
                  {transfersMethods.map((d, i) => (
                    <Detail key={i} title={getTitle(d.key)}>
                      <NumberDisplay
                        value={d.num_txs}
                        format="0,0"
                        className="text-slate-600 dark:text-slate-200 font-medium"
                      />
                    </Detail>
                  ))}
                </div>
              )}
            </CardBody>
            <CardFooter className="card-footer">
              <span className={titleClassName}>
                Methods
              </span>
            </CardFooter>
          </Card>
        )
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
        const chains = _.uniq(contracts.flatMap(d => d.chains))

        return (
          <Card key={metric} className="card">
            <CardBody className="mt-1 pb-2">
              <NumberDisplay
                value={contracts.length}
                format="0,0"
                className={valueClassName}
              />
              <div className="flex flex-wrap items-center mt-4">
                {_.slice(chains, 0, seeMoreChain ? chains.length : NUM_CHAINS_TRUNCATE).map((chain, i) => {
                  const {
                    name,
                    image,
                  } = { ...toArray(chains_data).find(c => c.id === chain) }

                  return (
                    <div key={i} className="mb-1.5 mr-1.5">
                      <Tooltip content={name}>
                        <div>
                          <Image
                            src={image}
                            width={24}
                            height={24}
                            className="3xl:w-8 3xl:h-8 rounded-full"
                          />
                        </div>
                      </Tooltip>
                    </div>
                  )
                })}
                {chains.length > NUM_CHAINS_TRUNCATE && (
                  <button
                    onClick={() => setSeeMoreChain(!seeMoreChain)}
                    className="bg-white dark:bg-slate-800 rounded text-blue-500 dark:text-white text-xs 3xl:text-sm font-medium mb-1.5 py-1 3xl:py-1.5 px-1.5 3xl:px-2.5"
                  >
                    {seeMoreChain ? 'See Less' : `+${chains.length - NUM_CHAINS_TRUNCATE} More`}
                  </button>
                )}
              </div>
            </CardBody>
            <CardFooter className="card-footer">
              <span className={titleClassName}>
                GMP Contracts
              </span>
            </CardFooter>
          </Card>
        )
      default:
        return null
    }
  }

  const diff = createMomentFromUnixtime(toTime).diff(createMomentFromUnixtime(fromTime), 'days')

  return (
    <div className="space-y-3">
      {(contractAddress || (fromTime && toTime)) && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
          <div>
            <AccountProfile address={contractAddress} />
          </div>
          {fromTime && toTime && (
            <span className="whitespace-nowrap text-slate-400 dark:text-slate-500 text-sm font-medium">
              {[fromTime, toTime].map(t => createMomentFromUnixtime(t)).map(t => t.format(`${TIME_FORMAT}${diff < 1 ? ' h:mm:ss A' : ''}`)).join(' - ')}
            </span>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(m => render(m))}
      </div>
    </div>
  )
}