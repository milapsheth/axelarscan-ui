import { constants } from 'ethers'

import Image from '../image'
import { getKeyType } from '../../lib/key'

export default (
  {
    value,
    explorer,
    type = 'tx',
    width = 16,
    height = 16,
    className = 'rounded-full opacity-60 hover:opacity-100',
  },
) => {
  const {
    url,
    address_path,
    contract_path,
    contract_0_path,
    transaction_path,
    icon,
  } = { ...explorer }

  let path
  let field

  if (type === 'tx') {
    if (getKeyType(value) === 'evmAddress') {
      type = 'address'
    }
  }

  switch (type) {
    case 'contract':
      field = 'address'
      break
    default:
      field = type
      break
  }

  switch (type) {
    case 'address':
      path = address_path
      break
    case 'contract':
      path = value === constants.AddressZero ? contract_0_path : contract_path
      break
    case 'tx':
      path = transaction_path
      break
    default:
      break
  }

  return value && url && (
    <a
      href={`${url}${path?.replace(`{${field}}`, value)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-max"
    >
      <Image
        src={icon}
        width={width}
        height={height}
        className={className}
      />
    </a>
  )
}