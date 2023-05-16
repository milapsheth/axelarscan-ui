import { utils } from 'ethers'

export const base64ToHash = string => {
  try {
    return utils.hexlify(utils.base64.decode(string))
  } catch (error) {
    return string
  }
}

export const base64ToString = string => {
  try {
    return utils.toUtf8String(utils.base64.decode(string))
  } catch (error) {
    return string
  }
}