const {
  BigNumber,
} = require('ethers')

export const toBigNumber = number => {
  try {
    return BigNumber.from(number).toString()
  } catch (error) {}

  return number?.toString()
}