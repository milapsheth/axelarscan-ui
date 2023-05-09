import Link from 'next/link'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'

import Image from '../image'
import Copy from '../copy'
import { toArray, ellipse, equalsIgnoreCase } from '../../lib/utils'
import accounts from '../../data/accounts'
import broadcasters from '../../data/broadcasters'

const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT

export default (
  {
    address,
    ellipseLength = 10,
    prefix = 'axelar',
    url,
  },
) => {
  const {
    _accounts,
  } = useSelector(
    state => (
      {
        _accounts: state.accounts,
      }
    ),
    shallowEqual,
  )
  const {
    accounts_data,
  } = { ..._accounts }

  prefix = address?.startsWith('axelar') ? 'axelar' : prefix

  const {
    name,
    image,
  } = {
    ...(
      toArray(_.concat(accounts, accounts_data)).find(a => equalsIgnoreCase(a.address, address) && (!a.environment || equalsIgnoreCase(a.environment, ENVIRONMENT))) ||
      (broadcasters[ENVIRONMENT]?.[address?.toLowerCase()] && {
        name: 'Axelar Relayer', // broadcasters[ENVIRONMENT][address.toLowerCase()],
        image: '/logos/accounts/axelarnet.svg',
      })
    ),
    address,
  }

  const nameComponent = (
    <>
      <span className="xl:hidden">
        {ellipse(name, ellipseLength * 2)}
      </span>
      <span className="hidden xl:block">
        {ellipse(name, ellipseLength * 2)}
      </span>
    </>
  )

  return (
    name ?
      <div className="min-w-max flex items-start space-x-2">
        {image && (
          <Image
            src={image}
            width={24}
            height={24}
            className="w-6 3xl:w-8 h-6 3xl:h-8 rounded-full"
          />
        )}
        <div className="flex flex-col">
          {url ?
            <Link
              href={typeof url === 'string' ? url : `/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-wider text-blue-500 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 font-medium"
            >
              {nameComponent}
            </Link> :
            <div className="tracking-wider text-blue-500 dark:text-blue-500 font-medium">
              {nameComponent}
            </div>
          }
          <Copy
            value={address}
            title={
              <div className="cursor-pointer text-slate-400 dark:text-slate-600">
                {ellipse(address, ellipseLength, prefix)}
              </div>
            }
          />
        </div>
      </div> :
      url ?
        <div className="flex items-center space-x-1">
          <Link
            href={typeof url === 'string' ? url : `/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tracking-wider text-blue-500 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 font-medium"
          >
            {ellipse(address, ellipseLength, prefix)}
          </Link>
          <Copy value={address} />
        </div> :
        <Copy
          value={address}
          title={
            <div className="cursor-pointer">
              {ellipse(address, ellipseLength, prefix)}
            </div>
          }
        />
  )
}