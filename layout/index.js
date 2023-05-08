import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import PageVisibility from 'react-page-visibility'
import { utils } from 'ethers'
import _ from 'lodash'

import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import meta from '../../lib/meta'
import { getChains, getAssets } from '../../lib/api/config'
import { getTokenPrices } from '../../lib/api/tokens'
import { getENS } from '../../lib/api/ens'
import { getChainMaintainers, getEscrowAddresses } from '../../lib/api/axelar'
import { stakingParams, bankSupply, stakingPool, slashingParams } from '../../lib/api/lcd'
import { getStatus } from '../../lib/api/rpc'
import { getTVL } from '../../lib/api/tvl'
import { getKeyType } from '../../lib/key'
import { toArray } from '../../lib/utils'
import { THEME, PAGE_VISIBLE, CHAINS_DATA, ASSETS_DATA, ENS_DATA, ACCOUNTS_DATA, CHAIN_DATA, STATUS_DATA, MAINTAINERS_DATA, TVL_DATA } from '../../reducers/types'

export default ({ children }) => {
  const dispatch = useDispatch()
  const {
    preferences,
    chains,
    assets,
    ens,
  } = useSelector(
    state => (
      {
        preferences: state.preferences,
        chains: state.chains,
        assets: state.assets,
        ens: state.ens,
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
    ens_data,
  } = { ...ens }

  const router = useRouter()
  const {
    pathname,
    asPath,
    query,
  } = { ...router }
  const {
    address,
  } = { ...query }

  useEffect(
    () => {
      if (typeof window !== 'undefined') {
        const _theme = localStorage.getItem(THEME)
        if (_theme && _theme !== theme) {
          dispatch({ type: THEME, value: _theme })
        }
      }
    },
    [theme],
  )

  // chains
  useEffect(
    () => {
      const getData = async () => dispatch({ type: CHAINS_DATA, value: toArray(await getChains()) })
      getData()
    },
    [],
  )

  // assets
  useEffect(
    () => {
      const getData = async () => {
        const assets = toArray(await getAssets())
        const prices = await getTokenPrices(assets.map(a => a.symbol))

        if (toArray(prices).length > 0) {
          for (let i = 0; i < prices.length; i++) {
            assets[i].price = prices[i]
          }
        }

        dispatch({ type: ASSETS_DATA, value: assets })
      }
      getData()
    },
    [],
  )

  // ens
  useEffect(
    () => {
      const getData = async () => {
        if (address && chains_data && getKeyType(address, chains_data) === 'evmAddress' && !ens_data?.[address]) {
          const data = await getENS(address)

          if (data) {
            dispatch({ type: ENS_DATA, value: data })
          }
        }
      }
      getData()
    },
    [address, chains_data],
  )

  // escrow addresses
  useEffect(
    () => {
      const getData = async () => {
        const {
          data,
        } = { ...await getEscrowAddresses() }

        if (data) {
          dispatch({ type: ACCOUNTS_DATA, value: data })
        }
      }
      getData()
    },
    [],
  )

  // chain
  useEffect(
    () => {
      const getData = async is_interval => {
        let response = await stakingParams()

        if (response) {
          const {
            params,
          } = { ...response }

          const {
            bond_denom,
          } = { ...params }

          dispatch({ type: CHAIN_DATA, value: { staking_params: { ...params } } })

          if (bond_denom) {
            response = await bankSupply(bond_denom)

            const {
              amount,
            } = { ...response?.amount }

            if (amount) {
              dispatch({ type: CHAIN_DATA, value: { bank_supply: { symbol: 'AXL', amount: utils.formatUnits(amount, 6) } } })
            }
          }
        }

        response = await stakingPool()

        if (response) {
          const {
            pool,
          } = { ...response }

          dispatch({ type: CHAIN_DATA, value: { staking_pool: Object.fromEntries(Object.entries({ ...pool }).map(([k, v]) => [k, utils.formatUnits(v, 6)])) } })
        }

        if (!is_interval) {
          response = await slashingParams()

          if (response) {
            const {
              params,
            } = { ...response }

            dispatch({ type: CHAIN_DATA, value: { slashing_params: { ...params } } })
          }
        }
      }

      getData()
      const interval = setInterval(() => getData(true), 30 * 1000)
      return () => clearInterval(interval)
    },
    [chains_data, assets_data],
  )

  // status
  useEffect(
    () => {
      const getData = async () => {
        const response = await getStatus()

        if (response) {
          dispatch({ type: STATUS_DATA, value: response })
        }
      }

      getData()
      const interval = setInterval(() => getData(), 6 * 1000)
      return () => clearInterval(interval)
    },
    [],
  )

  // maintainers
  useEffect(
    () => {
      const getChainData = async chain => {
        const {
          maintainers,
        } = { ...await getChainMaintainers({ chain }) }

        if (maintainers) {
          dispatch({ type: MAINTAINERS_DATA, value: { [chain]: maintainers } })
        }
      }

      const getData = () => {
        if (pathname?.includes('/validator') && chains_data) {
          toArray(chains_data).filter(c => c.chain_type === 'evm').map(c => c.id).forEach(c => getChainData(c))
        }
      }

      getData()
      const interval = setInterval(() => getData(), 5 * 60 * 1000)
      return () => clearInterval(interval)
    },
    [pathname, chains_data],
  )

  // tvl
  useEffect(
    () => {
      const getAssetData = async asset => {
        const {
          data,
          updated_at,
        } = { ...await getTVL({ asset }) }

        if (data) {
          dispatch({ type: TVL_DATA, value: { [asset]: { ..._.head(data), updated_at } } })
        }
      }

      const getData = () => {
        if (pathname?.includes('/tvl') && assets_data) {
          toArray(assets_data).filter(a => !a.no_tvl).map(a => a.denom).forEach(a => getAssetData(a))
        }
      }

      getData()
      const interval = setInterval(() => getData(), 5 * 60 * 1000)
      return () => clearInterval(interval)
    },
    [pathname, assets_data],
  )

  const {
    title,
    description,
    image,
    url,
  } = { ...meta(asPath) }

  return (
    <>
      <Head>
        <title>
          {title}
        </title>
        <meta
          name="og:site_name"
          property="og:site_name"
          content={title}
        />
        <meta
          name="og:title"
          property="og:title"
          content={title}
        />
        <meta
          itemProp="name"
          content={title}
        />
        <meta
          itemProp="headline"
          content={title}
        />
        <meta
          itemProp="publisher"
          content={title}
        />
        <meta
          name="twitter:title"
          content={title}
        />

        <meta
          name="description"
          content={description}
        />
        <meta
          name="og:description"
          property="og:description"
          content={description}
        />
        <meta
          itemProp="description"
          content={description}
        />
        <meta
          name="twitter:description"
          content={description}
        />

        <meta
          name="og:image"
          property="og:image"
          content={image}
        />
        <meta
          itemProp="thumbnailUrl"
          content={image}
        />
        <meta
          itemProp="image"
          content={image}
        />
        <meta
          name="twitter:image"
          content={image}
        />
        <link
          rel="image_src"
          href={image}
        />

        <meta
          name="og:url"
          property="og:url"
          content={url}
        />
        <meta
          itemProp="url"
          content={url}
        />
        <meta
          name="twitter:url"
          content={url}
        />
        <link
          rel="canonical"
          href={url}
        />
      </Head>
      <PageVisibility onChange={v => dispatch({ type: PAGE_VISIBLE, value: v })}>
        <div
          data-layout="layout"
          data-background={theme}
          data-navbar={theme}
          className={`min-h-screen antialiased disable-scrollbars text-sm ${theme}`}
        >
          <div className="wrapper">
            <div className="main w-full bg-white dark:bg-black">
              <Navbar />
              <div className="w-full px-2 sm:px-4">
                {children}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </PageVisibility>
    </>
  )
}