import { toArray } from '../../../lib/utils'

export default toArray(
  [
    {
      title: 'Validators',
      path: '/validators',
      others_paths: ['/validators/[status]', '/validator/[address]'],
    },
    {
      title: 'Blocks',
      path: '/blocks',
      others_paths: ['/block/[height]'],
    },
    {
      title: 'Transactions',
      path: '/transactions/search',
      others_paths: ['/transactions', '/txs/search', '/txs', '/tx/[tx]', '/transactions/[tx]', '/txs/[tx]', '/transaction/[tx]'],
    },
    {
      title: 'EVM Polls',
      path: '/evm-polls',
      others_paths: ['/evm-poll/[id]', '/polls', '/poll/[id]'],
    },
    {
      title: 'EVM Batches',
      path: '/evm-batches',
      others_paths: ['/evm-batch/[chain]/[id]', '/batches', '/batch/[chain]/[id]'],
    },
    {
      title: 'Interchain',
      path: '/interchain-transfers',
      others_paths: ['/transfers', '/transfers/search', '/transfer/[tx]', '/gmp', '/gmp/search', '/gmp/[tx]'],
    },
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet' && {
      title: 'TVL',
      path: '/tvl',
    },
    {
      title: 'Resources',
      path: '/resources',
      others_paths: ['/resources/[by]', '/assets'],
    },
  ]
)