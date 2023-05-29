import Link from 'next/link'
import { Card, CardBody, CardFooter, Tooltip } from '@material-tailwind/react'
import moment from 'moment'

import Spinner from '../spinner'
import NumberDisplay from '../number'
import { numberFormat } from '../../lib/utils'

const METRICS = ['block', 'avg_block_time', 'validators', 'staked', 'apr', 'inflation']
const DATE_FORMAT = 'MMM D, YYYY h:mm:ss A z'

export default ({ data }) => {
  const {
    block_data,
    validators_data,
    token_data,
    inflation_data,
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

  const render = id => {
    const valueClassName = 'text-black dark:text-white text-3xl lg:text-2xl 2xl:text-3xl font-medium'
    const titleClassName = 'whitespace-nowrap text-blue-400 dark:text-blue-500 text-base'

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
        tooltip = 'the average block time from the last 100 blocks'
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
      default:
        break
    }

    return (
      <Link key={id} href={url}>
        <Card className="card">
          <CardBody className="mt-0.5 pt-4 2xl:pt-6 pb-1 2xl:pb-2 px-4 2xl:px-6">
            {!loading ?
              tooltip ?
                <Tooltip content={tooltip}>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {METRICS.map(m => render(m))}
    </div>
  )
}