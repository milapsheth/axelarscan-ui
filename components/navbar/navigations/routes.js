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
      others_paths: ['/transactions', '/tx/[tx]'],
    },
    {
      title: 'EVM Polls',
      path: '/evm-polls',
    },
    {
      title: 'Batches',
      path: '/batches',
      others_paths: ['/batch/[chain]/[id]'],
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
      title: 'Contracts',
      path: '/contracts',
    },
    {
      title: 'Assets',
      path: '/assets',
    },
  ]
)