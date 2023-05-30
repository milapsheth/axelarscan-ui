import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Tooltip } from '@material-tailwind/react'
import _ from 'lodash'
import moment from 'moment'

import Spinner from '../../spinner'
import { searchTransfers } from '../../../lib/api/transfers'
import { getChainData, getAssetData } from '../../../lib/config'
import { split, equalsIgnoreCase } from '../../../lib/utils'

const WRAP_PREFIXES = ['w', 'axl']

export default () => {
  const { chains, assets } = useSelector(state => ({ chains: state.chains, assets: state.assets }), shallowEqual)
  const { chains_data } = { ...chains }
  const { assets_data } = { ...assets }

  const router = useRouter()
  const { query } = { ...router }
  const { tx, transfer_id } = { ...query }

  const [data, setData] = useState(null)

  useEffect(
    () => {
      const getData = async () => {
        if (tx && assets_data && !(matched && ['received', 'failed'].includes(data.simplified_status))) {
          const response = await searchTransfers({ txHash: tx, size: 1 })
          setData(_.head(response?.data))
        }
        else if (transfer_id) {
          const response = await searchTransfers({ transferId: transfer_id, size: 1 })
          const { send } = { ..._.head(response?.data) }
          const { txhash } = { ...send }
          if (txhash) {
            router.push(`/transfer/${txhash}`)
          }
          else {
            setData({})
          }
        }
      }

      getData()
      const interval = setInterval(() => getData(), 0.5 * 60 * 1000)
      return () => clearInterval(interval)
    },
    [tx, transfer_id, assets_data],
  )

  const {
    send,
    link,
    confirm,
    vote,
    command,
    ibc_send,
    axelar_transfer,
    wrap,
    unwrap,
    erc20_transfer,
    type,
  } = { ...data }
  const { source_chain, denom, amount, fee, insufficient_fee, status } = { ...send }
  let { destination_chain, sender_address } = { ...send }
  let { original_source_chain, original_destination_chain, deposit_address, recipient_address } = { ...link }
  destination_chain = unwrap?.destination_chain || destination_chain || link?.destination_chain
  sender_address = wrap?.sender_address || erc20_transfer?.sender_address || sender_address
  original_source_chain = send?.original_source_chain || original_source_chain
  original_destination_chain = send?.original_destination_chain || original_destination_chain
  deposit_address = wrap?.deposit_address || unwrap?.deposit_address_link || erc20_transfer?.deposit_address || send?.recipient_address || deposit_address
  recipient_address = unwrap?.recipient_address || recipient_address

  const source_chain_data = getChainData(original_source_chain, chains_data) || getChainData(source_chain, chains_data)
  const destination_chain_data = getChainData(original_destination_chain, chains_data) || getChainData(destination_chain, chains_data)
  const axelar_chain_data = getChainData('axelarnet', chains_data)
  const deposit_chain_data = getChainData(deposit_address?.startsWith('axelar') ? 'axelarnet' : original_source_chain || source_chain, chains_data)
  const asset_data = getAssetData(denom, assets_data)
  const { addresses } = { ...asset_data }
  let { symbol, image } = { ...addresses?.[source_chain_data?.id] } 
  symbol = symbol || asset_data?.symbol || denom
  image = image || asset_data?.image
  if (symbol && (['wrap', 'unwrap'].includes(type) || wrap || unwrap)) {
    const index = WRAP_PREFIXES.findIndex(p => symbol.toLowerCase().startsWith(p) && !equalsIgnoreCase(p, symbol))
    if (index > -1) {
      const prefix = WRAP_PREFIXES[index]
      symbol = symbol.substring(prefix.length)
      if (image) {
        image =
          split(image, 'normal', '/').map(s => {
            if (s?.includes('.')) {
              const index = WRAP_PREFIXES.findIndex(p => s.toLowerCase().startsWith(p))
              if (index > -1) {
                const prefix = WRAP_PREFIXES[index]
                s = s.substring(prefix.length)
              }
            }
            return s
          }).join('/')
      }
    }
  }

  const matched = equalsIgnoreCase(tx, data?.send?.txhash)

  return (
    <div className="children px-3">
      {data && matched ?
        <div className="max-w-6xl space-y-4 sm:space-y-6 mt-6 sm:mt-8 mx-auto">
          {!tx ?
            <span className="text-slate-400 dark:text-slate-500 text-base">
              Transaction not found
            </span> :
            <>
            </>
          }
        </div> :
        <div className="loading">
          <Spinner name="Blocks" />
        </div>
      }
    </div>
  )
}