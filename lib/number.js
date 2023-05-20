import { BigNumber, utils } from 'ethers'

import { split } from './utils'

export const toBigNumber = number => {
  try {
    return BigNumber.from(number).toString()
  } catch (error) {}

  return number?.toString()
}

export const formatUnits = (
  number,
  decimals = 6,
) => {
  if (typeof number === 'string') {
    const start_denom_index = split(number, 'normal', '').findIndex(c => isNaN(c)) || -1
    if (start_denom_index > -1) {
      number = number.substring(0, start_denom_index)
    }
  }

  return number && Number(utils.formatUnits(toBigNumber(number), decimals))
}