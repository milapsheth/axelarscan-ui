import { QueryClient } from '@tanstack/react-query'
import { configureChains, createClient } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { EthereumClient, w3mConnectors } from '@web3modal/ethereum'
import { mainnet, goerli, bsc, bscTestnet, polygon, polygonMumbai, avalanche, avalancheFuji, fantom, fantomTestnet, moonbeam, moonbaseAlpha, aurora, auroraTestnet, arbitrum, arbitrumGoerli, optimism, optimismGoerli, celo, celoAlfajores } from '@wagmi/chains'

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
export const EVM_CHAIN_CONFIGS =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet' ?
    [
      { _id: 'ethereum', ...mainnet },
      { _id: 'binance', ...bsc },
      { _id: 'polygon', ...polygon },
      { _id: 'avalanche', ...avalanche },
      { _id: 'fantom', ...fantom },
      { _id: 'moonbeam', ...moonbeam },
      { _id: 'aurora', ...aurora },
      { _id: 'arbitrum', ...arbitrum },
      { _id: 'optimism', ...optimism },
      { _id: 'base', {} },
      { _id: 'celo', ...celo },
      { _id: 'kava', {} },
      { _id: 'filecoin', {} },
    ] :
    [
      { _id: 'goerli', ...goerli },
      { _id: 'binance', ...bscTestnet },
      { _id: 'polygon', ...polygonMumbai },
      { _id: 'avalanche', ...avalancheFuji },
      { _id: 'fantom', ...fantomTestnet },
      { _id: 'moonbeam', ...moonbaseAlpha },
      { _id: 'aurora', ...auroraTestnet },
      { _id: 'arbitrum', ...arbitrumGoerli },
      { _id: 'optimism', ...optimismGoerli },
      { _id: 'base', {} },
      { _id: 'celo', ...celoAlfajores },
      { _id: 'kava', {} },
      { _id: 'filecoin', {} },
    ]

const { webSocketProvider, provider } = configureChains(EVM_CHAIN_CONFIGS, [publicProvider()])
export const queryClient = new QueryClient()
export const wagmiClient =
  createClient(
    {
      autoConnect: true,
      provider,
      webSocketProvider,
      connectors: w3mConnectors({ chains: EVM_CHAIN_CONFIGS, projectId: WALLETCONNECT_PROJECT_ID, version: 2 }),
      queryClient,
    }
  )
export const ethereumClient = new EthereumClient(wagmiClient, EVM_CHAIN_CONFIGS)