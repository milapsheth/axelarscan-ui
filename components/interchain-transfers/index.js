import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { Tabs, TabsHeader, TabsBody, Tab, TabPanel } from '@material-tailwind/react'

import Filters from './filters'
import Overview from './overview'
import GMP from './gmps'
import Transfers from './transfers'
import { getTitle } from '../../lib/utils'

const MENUS = ['overview', 'gmp_transfers', 'token_transfers']

export default () => {
  const router = useRouter()
  const {
    pathname,
  } = { ...router }

  const [menu, setMenu] = useState(null)

  useEffect(
    () => {
      switch (pathname) {
        case '/interchain-transfers':
          setMenu('overview')
          break
        case '/gmp':
          router.push('/gmp/search')
        case '/gmp/search':
          setMenu('gmp_transfers')
          break
        case '/transfers':
          router.push('/transfers/search')
        case '/transfers/search':
          setMenu('token_transfers')
          break
        default:
          break
      }
    },
    [pathname],
  )

  useEffect(
    () => {
      switch (menu) {
        case 'overview':
          router.push('/interchain-transfers')
          break
        case 'gmp_transfers':
          router.push('/gmp/search')
          break
        case 'token_transfers':
          router.push('/transfers/search')
          break
        default:
          break
      }
    },
    [menu],
  )

  const render = menu => {
    switch (menu) {
      case 'overview':
        return <Overview />
      case 'gmp_transfers':
        return <GMP />
      case 'token_transfers':
        return <Transfers />
      default:
        return <div />
    }
  }

  return menu && (
    <Tabs value={menu} className="children tabs pt-8 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-2">
        <TabsHeader className="max-w-md">
          {MENUS.map(m => (
            <Tab
              key={m}
              value={m}
              onClick={() => setMenu(m)}
              className="whitespace-nowrap normal-case text-xs sm:text-base"
            >
              {getTitle(m)}
            </Tab>
          ))}
        </TabsHeader>
        <Filters />
      </div>
      <TabsBody>
        {MENUS.map(m => (
          <TabPanel
            key={m}
            value={m}
          >
            {render(m)}
          </TabPanel>
        ))}
      </TabsBody>
    </Tabs>
  )
}