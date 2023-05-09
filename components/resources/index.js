import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Card, CardBody, CardFooter, Chip, Tabs, TabsHeader, TabsBody, Tab, TabPanel, Tooltip } from '@material-tailwind/react'
import _ from 'lodash'
import { TbFileSearch } from 'react-icons/tb'

import Image from '../image'
import ValueBox from '../value-box'
import { toArray, getTitle } from '../../lib/utils'

const BYS = ['chains', 'assets']

export default () => {
  const {
    preferences,
    chains,
    assets,
    contracts,
  } = useSelector(
    state => (
      {
        preferences: state.preferences,
        chains: state.chains,
        assets: state.assets,
        contracts: state.contracts,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }
  const {
    chains_data,
  } = { ...chains }
  const {
    assets_data,
  } = { ...assets }
  const {
    contracts_data,
  } = { ...contracts }

  const router = useRouter()
  const {
    pathname,
    query,
  } = { ...router }

  const [rendered, setRendered] = useState(false)
  const [by, setBy] = useState(query.by)

  useEffect(
    () => {
      switch (pathname) {
        case '/resources':
          router.push(`/resources/${_.head(BYS)}`)
          break
        case '/assets':
          router.push('/resources/assets')
          break
        default:
          if (!rendered) {
            setRendered(true)
          }
          else if (by) {
            router.push(`/resources/${by}`)
          }
          break
      }
    },
    [pathname, rendered, by],
  )

  useEffect(() => setBy(BYS.includes(query.by) ? query.by : query.by ? _.head(BYS) : query.by), [query.by])

  const render = by => {
    const {
      gateway_contracts,
      gas_service_contracts,
    } = { ...contracts_data }

    switch (by) {
      case 'chains':
        return (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-7 gap-4 xl:gap-6">
            {toArray(chains_data).filter(c => !c.no_inflation).map((c, i) => {
              const {
                id,
                chain_id,
                chain_name,
                endpoints,
                name,
                image,
                explorer,
                prefix_address,
                chain_type,
              } = { ...c }

              const {
                rpc,
                lcd,
              } = { ...endpoints }

              const {
                url,
                address_path,
              } = { ...explorer }

              const gateway_address = gateway_contracts?.[id]?.address
              const gas_service_address = gas_service_contracts?.[id]?.address

              return (
                <Card key={i} className="card">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <Image
                        src={image}
                        width={52}
                        height={52}
                        className="3xl:w-16 3xl:h-16 rounded-full p-1 -m-1"
                      />
                      <div className="flex items-center space-x-2">
                        {url && (
                          <Tooltip content="Explorer">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 dark:text-blue-500"
                            >
                              <TbFileSearch size={24} />
                            </a>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="title flex items-center space-x-2">
                      <span>
                        {name}
                      </span>
                      <Tooltip content="Chain Name">
                        <span>
                          ({chain_name})
                        </span>
                      </Tooltip>
                    </div>
                    <div className="description">
                      {gateway_address && (
                        <ValueBox
                          url={url && `${url}${address_path?.replace('{address}', gateway_address)}`}
                          title="Gateway Address"
                          value={gateway_address}
                        />
                      )}
                      {gas_service_address && (
                        <ValueBox
                          url={url && `${url}${address_path?.replace('{address}', gas_service_address)}`}
                          title="Gas Service Address"
                          value={gas_service_address}
                        />
                      )}
                      {toArray(rpc).length > 0 && (
                        <ValueBox
                          url={_.head(toArray(rpc))}
                          title="RPC Endpoint"
                          value={_.head(toArray(rpc))}
                          noEllipse={true}
                        />
                      )}
                      {toArray(lcd).length > 0 && (
                        <ValueBox
                          url={_.head(toArray(lcd))}
                          title="LCD Endpoint"
                          value={_.head(toArray(lcd))}
                          noEllipse={true}
                        />
                      )}
                      {prefix_address && (
                        <ValueBox
                          title="Prefix"
                          value={prefix_address}
                        />
                      )}
                    </div>
                  </CardBody>
                  <CardFooter className="card-footer">
                    <div className="flex items-center space-x-2">
                      <Chip color="amber" value={getTitle(chain_type)} />
                      {chain_id && (
                        <Chip color="teal" value={`ID: ${chain_id}`} />
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )
      case 'assets':
        return (
          <div>
          </div>
        )
      default:
        return <div />
    }
  }

  return (
    rendered && by && (
      <Tabs value={by} className="tabs pt-8 px-2 sm:px-4">
        <TabsHeader className="max-w-xs">
          {BYS.map(b => (
            <Tab
              key={b}
              value={b}
              onClick={() => setBy(b)}
              className="capitalize"
            >
              {b}
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody>
          {BYS.map(b => (
            <TabPanel
              key={b}
              value={b}
            >
              {render(b)}
            </TabPanel>
          ))}
        </TabsBody>
      </Tabs>
    )
  )
}