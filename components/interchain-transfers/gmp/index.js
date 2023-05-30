import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Alert, Tooltip } from '@material-tailwind/react'
import { AxelarGMPRecoveryAPI } from '@axelar-network/axelarjs-sdk'
import { Contract } from 'ethers'
import _ from 'lodash'
import moment from 'moment'

import Spinner from '../../spinner'
import Wallet from '../../wallet'
import { searchGMP, saveGMP, isContractCallApproved } from '../../../lib/api/gmp'
import { getProvider } from '../../../lib/chain/evm'
import { getChainData, getAssetData } from '../../../lib/config'
import { toBigNumber } from '../../../lib/number'
import { split, toArray, equalsIgnoreCase, sleep, parseError } from '../../../lib/utils'

import IAxelarExecutable from '../../../data/contracts/interfaces/IAxelarExecutable.json'
import parameters from '../../../data/gmp/parameters'

const MIN_GAS_REMAIN_AMOUNT = 0.000001

const getTransactionKey = tx => {
  const DELIMETERS = ['_', ':']
  let txHash
  let txIndex
  let txLogIndex

  if (tx && DELIMETERS.findIndex(s => tx.includes(s)) > -1) {
    let hash_split = txHash
    for (const delimeter of DELIMETERS) {
      hash_split = split(hash_split, 'normal', delimeter).join(_.head(DELIMETERS))
    }
    hash_split = split(hash_split, 'normal', _.head(DELIMETERS))

    txHash = _.head(hash_split)
    if (hash_split.length > 2) {
      txIndex = hash_split[1]
    }
    txLogIndex = _.last(hash_split)
  }
  else {
    txHash = tx
  }

  txIndex = !isNaN(txIndex) ? Number(txIndex) : undefined
  txLogIndex = !isNaN(txLogIndex) ? Number(txLogIndex) : undefined
  return [txHash, txIndex, txLogIndex]
}

export default () => {
  const { chains, assets, wallet } = useSelector(state => ({ chains: state.chains, assets: state.assets, wallet: state.wallet }), shallowEqual)
  const { chains_data } = { ...chains }
  const { assets_data } = { ...assets }
  const { wallet_data } = { ...wallet }
  const { chain_id, signer } = { ...wallet_data }

  const router = useRouter()
  const { query } = { ...router }
  const { tx, edit } = { ...query }

  const [api, setAPI] = useState(null)
  const [data, setData] = useState(null)

  const [processing, setProcessing] = useState(null)
  const [response, setResponse] = useState(null)

  const [txHashEdit, setTxHashEdit] = useState(null)
  const [txHashEditing, setTxHashEditing] = useState(false)
  const [txHashUpdating, setTxHashUpdating] = useState(false)

  useEffect(
    () => {
      if (!api) {
        setAPI(new AxelarGMPRecoveryAPI({ environment: process.env.NEXT_PUBLIC_ENVIRONMENT, axelarRpcUrl: process.env.NEXT_PUBLIC_RPC_URL, axelarLcdUrl: process.env.NEXT_PUBLIC_LCD_URL }))
      }
    },
    [],
  )

  useEffect(
    () => {
      getData()
      const interval = setInterval(() => getData(), 0.15 * 60 * 1000)
      return () => clearInterval(interval)
    },
    [tx, chains_data, api, processing, txHashEditing],
  )

  const resetTxHashEdit = () => {
    setResponse(null)
    setTxHashEdit(null)
    setTxHashEditing(false)
    setTxHashUpdating(false)
  }

  const getData = async () => {
    if (tx && chains_data && api && !processing && !txHashEditing && !(matched && ['received', 'failed'].includes(data.simplified_status) && (data.executed || data.error) && (data.refunded || data.not_to_refund))) {
      if (data) {
        await sleep(3 * 1000)
        if (!matched) {
          setData(null)
          resetTxHashEdit()
        }
      }

      const response = await searchGMP({ txHash: tx, size: 1 })
      const _data = _.head(response?.data)

      if (_data) {
        const {
          call,
          gas_paid,
          gas_paid_to_callback,
          approved,
          callback,
          is_call_from_relayer,
        } = { ..._data }

        // callback
        if (callback?.transactionHash) {
          const {
            transactionHash,
            transactionIndex,
            logIndex,
          } = { ...callback }

          const response = await searchGMP({ txHash: transactionHash, txIndex: transactionIndex, txLogIndex: logIndex })
          const callback_data = toArray(response?.data).find(d => equalsIgnoreCase(d.call?.transactionHash, transactionHash))

          if (callback_data) {
            _data.callback_data = callback_data
          }
        }

        // origin
        if (call && !gas_paid && (gas_paid_to_callback || is_call_from_relayer)) {
          const {
            transactionHash,
          } = { ...call }

          const response = await searchGMP({ txHash: transactionHash })
          const origin_data = toArray(response?.data).find(d => equalsIgnoreCase(d.executed?.transactionHash, transactionHash))

          if (origin_data) {
            _data.origin_data = origin_data
          }
        }

        if (call && approved) {
          const {
            destinationChain,
            payload,
          } = { ...call.returnValues }
          const {
            contractAddress,
            commandId,
            sourceChain,
            sourceAddress,
            payloadHash,
            symbol,
            amount,
          } = { ...approved.returnValues }

          if (STAGING || EDITABLE) {
            try {
              const { result } = { ...await isContractCallApproved({ destinationChain, commandId, sourceChain, sourceAddress, contractAddress, payloadHash, symbol, amount }) }
              _data.is_approved = result       
            } catch (error) {}
          }

          try {
            const provider = getProvider(destinationChain, chains_data)
            const contract = new Contract(contractAddress, IAxelarExecutable.abi, provider)
            const { data } = { ...(symbol ? await contract.populateTransaction.executeWithToken(commandId, sourceChain, sourceAddress, payload, symbol, toBigNumber(amount)) : await contract.populateTransaction.execute(commandId, sourceChain, sourceAddress, payload)) }
            if (data) {
              _data.execute_data = data
            }
          } catch (error) {}
        }

        console.log('[data]', _data)
        setData(_data)
        return _data
      }
      else {
        setData({})
      }
    }
    return null
  }

  const save = async params => {
    await saveGMP(params)
    getData()
    resetTxHashEdit()
  }

  const addGas = async data => {
    if (signer && api && data) {
      setProcessing(true)
      try {
        setResponse({ status: 'pending', message: 'Adding gas' })

        const { call, approved } = { ...data }
        const { chain, transactionHash, transactionIndex, logIndex, returnValues } = { ...call }
        const { destinationChain } = { ...returnValues }
        const { gas_add_adjustment } = { ...parameters }
        const gasMultipler = gas_add_adjustment[process.env.NEXT_PUBLIC_ENVIRONMENT]?.[destinationChain?.toLowerCase()] || gas_add_adjustment[process.env.NEXT_PUBLIC_ENVIRONMENT]?.default

        console.log('[addGas request]', { chain, transactionHash, refundAddress: address, gasMultipler })
        const response = await api.addNativeGas(chain, transactionHash, { useWindowEthereum: true, refundAddress: address, gasMultipler })
        console.log('[addGas response]', response)
        const { success, error, transaction } = { ...response }
        const { message } = { ...error }

        if (success) {
          await sleep(1 * 1000)
        }
        const _data = success && await getData()
        setResponse({
          status: success ? 'success' : 'failed',
          message: message || error || 'Pay gas successful',
          txhash: transaction?.transactionHash,
        })

        if (success && !approved && _data && !_data.approved) {
          approve(_data, true)
        }
      } catch (error) {
        setResponse({ status: 'failed', ...parseError(error) })
      }
      setProcessing(false)
    }
  }

  const approve = async (data, afterPayGas = false) => {
    if (api && data) {
      setProcessing(true)
      try {
        if (!afterPayGas) {
          setResponse({ status: 'pending', message: 'Approving' })
        }

        const { call } = { ...data }
        const { transactionHash, transactionIndex, logIndex } = { ...call }

        console.log('[approve request]', { transactionHash })
        const response = await api.manualRelayToDestChain(transactionHash)
        console.log('[approve response]', response)
        const { success, error, signCommandTx } = { ...response }
        const { message } = { ...error }
        const { txhash } = { ...signCommandTx }

        if (success) {
          await sleep(15 * 1000)
        }
        if (!afterPayGas || success) {
          setResponse({
            status: success ? 'success' : 'failed',
            message: message || error || 'Approve successful',
            txhash,
            isAxelar: true,
          })
        }
      } catch (error) {
        setResponse({ status: 'failed', ...parseError(error) })
      }
      setProcessing(false)
    }
  }

  const execute = async data => {
    if (signer && api && data) {
      setProcessing(true)
      try {
        setResponse({ status: 'pending', message: 'Executing' })

        const { call, approved } = { ...data }
        const { transactionHash, transactionIndex, logIndex } = { ...call }
        const { chain } = { ...approved }
        const { execute_gas_limit_buffer } = { ...parameters }
        const gasLimitBuffer = execute_gas_limit_buffer[process.env.NEXT_PUBLIC_ENVIRONMENT]?.[chain] || execute_gas_limit_buffer[process.env.NEXT_PUBLIC_ENVIRONMENT]?.default

        console.log('[execute request]', { transactionHash, logIndex, gasLimitBuffer })
        const response = await api.execute(transactionHash, logIndex, { useWindowEthereum: true, gasLimitBuffer })
        console.log('[execute response]', response)
        const { success, error, transaction } = { ...response }
        const { message } = { ...error }

        setResponse({
          status: success && transaction ? 'success' : 'failed',
          message: message || error || (transaction ? 'Execute successful' : 'Error Execution. Please see the error on console.'),
          txhash: transaction?.transactionHash,
        })
      } catch (error) {
        setResponse({ status: 'failed', ...parseError(error) })
      }
      setProcessing(false)
    }
  }

  const refund = async data => {
    if (data) {
      setProcessing(true)
      try {
        setResponse({ status: 'pending', message: 'Refunding' })

        const { call } = { ...data }
        const { transactionHash, transactionIndex, logIndex } = { ...call }
        const params = {
          sourceTransactionHash: transactionHash,
          sourceTransactionIndex: transactionIndex,
          sourceTransactionLogIndex: logIndex,
          event: 'to_refund',
        }

        console.log('[refund request]', { ...params })
        const response = await save(params)
        console.log('[refund response]', response)
        const { result } = { ...response?.response }
        const success = result === 'updated' || response?.event === 'to_refund'

        if (success) {
          await sleep(15 * 1000)
        }
        setResponse({
          status: success ? 'success' : 'failed',
          message: success ? 'Start refund process successful' : 'Cannot start refund process',
        })
      } catch (error) {
        setResponse({ status: 'failed', ...parseError(error) })
      }
      setProcessing(false)
    }
  }

  const {
    call,
    gas_paid,
    gas_paid_to_callback,
    express_executed,
    confirm,
    approved,
    executed,
    is_executed,
    error,
    refunded,
    command_id,
    fees,
    gas,
    is_invalid_destination_chain,
    is_invalid_call,
    is_insufficient_fee,
    is_call_from_relayer,
    is_not_enough_gas,
    not_enough_gas_to_execute,
    no_gas_remain,
    status,
    callback_data,
    origin_data,
    execute_data,
  } = { ...data }
  const { event, chain, chain_type, destination_chain_type } = { ...call }
  const { sender, destinationChain, destinationContractAddress, payloadHash, payload, symbol, amount } = { ...call?.returnValues }
  const { from } = { ...call?.transaction }
  const { sourceChain } = { ...approved?.returnValues }
  let { commandId } = { ...approved?.returnValues }
  commandId = commandId || command_id
  const relayer_address = executed?.transaction?.from
  const { usd } = { ...fees?.source_token?.token_price }

  const source_chain_data = getChainData(chain, chains_data)
  const destination_chain_data = getChainData(destinationChain, chains_data)
  const axelar_chain_data = getChainData('axelarnet', chains_data)
  const asset_data = getAssetData(symbol, assets_data)
  const { addresses } = { ...asset_data }
  let { decimals, image } = { ...addresses?.[chain] } 
  decimals = decimals || asset_data?.decimals || 18
  image = image || asset_data?.image

  const [txHash, txIndex, txLogIndex] = getTransactionKey(tx)
  const matched = equalsIgnoreCase(txHash, data?.call?.transactionHash) && (typeof txIndex !== 'number' || txIndex === data.call.transactionIndex) && (typeof txLogIndex !== 'number' || txLogIndex === data.call.logIndex)
  const notFound = data && Object.keys(data).length < 1
  const STAGING = ['staging', 'localhost'].findIndex(s => process.env.NEXT_PUBLIC_SITE_URL?.includes(s)) > -1
  const EDITABLE = edit === 'true' && (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'mainnet' || STAGING)
  const wrongSourceChain = source_chain_data && source_chain_data.chain_id !== chain_id && !processing
  const wrongDestinationChain = destination_chain_data && destination_chain_data.chain_id !== chain_id && !processing

  const addGasButton =
    (!(gas_paid || gas_paid_to_callback) || is_insufficient_fee) && !executed && !is_executed && chain_type !== 'cosmos' &&
    (!(gas_paid || gas_paid_to_callback) || is_insufficient_fee || is_not_enough_gas || not_enough_gas_to_execute || gas?.gas_remain_amount < MIN_GAS_REMAIN_AMOUNT) && (
      <div className="flex items-center space-x-2">
        {signer && !wrongSourceChain && (
          <button
            disabled={processing}
            onClick={() => addGas(data)}
            className={`bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 ${processing ? 'pointer-events-none' : ''} rounded flex items-center text-white py-1 px-2`}
          >
            {processing && <Spinner width={14} height={14} color="white" />}
            <span className="whitespace-nowrap font-medium">
              {gas_paid ? 'Add' : 'Pay'} gas
            </span>
          </button>
        )}
        <Wallet connectChainId={source_chain_data?.chain_id} />
      </div>
    )

  const approveButton =
    call && !(destination_chain_type === 'cosmos' ? confirm : approved) && !executed && !is_executed &&
    !(is_invalid_destination_chain || is_invalid_call || is_insufficient_fee || !gas?.gas_remain_amount) &&
    (confirm || moment().diff(moment(call.block_timestamp * 1000), 'minutes') >= 5) &&
    moment().diff(moment((confirm || call).block_timestamp * 1000), 'minutes') >= 1 && (
      <div className="flex items-center space-x-2">
        <button
          disabled={processing}
          onClick={() => approve(data)}
          className={`bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 ${processing ? 'pointer-events-none' : ''} rounded flex items-center text-white py-1 px-2`}
        >
          {processing && <Spinner width={14} height={14} color="white" />}
          <span className="font-medium">
            Approve
          </span>
        </button>
      </div>
    )

  const executeButton =
    payload && approved && !executed && !is_executed && destination_chain_type !== 'cosmos' &&
    (error || moment().diff(moment(approved.block_timestamp * 1000), 'minutes') >= 2) && (
      <div className="flex items-center space-x-2">
        {signer && !wrongDestinationChain && (
          <button
            disabled={processing}
            onClick={() => execute(data)}
            className={`bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 ${processing ? 'pointer-events-none' : ''} rounded flex items-center text-white py-1 px-2`}
          >
            {processing && <Spinner width={14} height={14} color="white" />}
            <span className="font-medium">
              Execute
            </span>
          </button>
        )}
        <Wallet connectChainId={destination_chain_data?.chain_id} />
      </div>
    )

  const refundButton =
    !approveButton && !executeButton && !no_gas_remain && (approved?.block_timestamp < moment().subtract(3, 'minutes').unix() || is_invalid_destination_chain || is_invalid_call || is_insufficient_fee) &&
    ((executed && (!callback_data || moment().diff(moment((executed.block_timestamp) * 1000), 'minutes') >= 10)) || is_executed || error || is_invalid_destination_chain || is_invalid_call || is_insufficient_fee) &&
    (editable || (
      gas?.gas_remain_amount >= MIN_GAS_REMAIN_AMOUNT && (gas.gas_remain_amount / gas.gas_paid_amount > 0.1 || gas.gas_remain_amount * usd > 1 || (is_insufficient_fee && gas.gas_paid_amount < gas.gas_base_fee_amount && gas.gas_paid_amount * usd > 1)) &&
      (!refunded || refunded.error || refunded.block_timestamp < gas_paid?.block_timestamp)
    )) && (
      <div className="flex items-center space-x-2">
        <button
          disabled={processing}
          onClick={() => refund(data)}
          className={`bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 ${processing ? 'pointer-events-none' : ''} rounded flex items-center text-white py-1 px-2`}
        >
          {processing && <Spinner width={14} height={14} color="white" />}
          <span className="font-medium">
            Refund
          </span>
        </button>
      </div>
    )

  return (
    <div className="children px-3">
      {data && (matched || notFound) ?
        <div className="max-w-6xl space-y-4 sm:space-y-6 mt-6 sm:mt-8 mx-auto">
          {notFound ?
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