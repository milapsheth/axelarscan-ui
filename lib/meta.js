import _ from 'lodash'

import { split, getTitle } from './utils'

export default (path, data) => {
  path = !path ? '/' : path.toLowerCase()
  path = path.includes('?') ? path.substring(0, path.indexOf('?')) : path
  const _paths = split(path, 'normal', '/')

  const title = `${_.reverse(_.cloneDeep(_paths)).filter(x => !(x.startsWith('[') && x.endsWith(']'))).map(x => getTitle(x, data)).join(' - ')}${_paths.length > 0 ? ` | ${process.env.NEXT_PUBLIC_APP_NAME}` : process.env.NEXT_PUBLIC_DEFAULT_TITLE}`
  const description = process.env.NEXT_PUBLIC_DEFAULT_DESCRIPTION
  const image = `${process.env.NEXT_PUBLIC_APP_URL}/images/ogimage.png`
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${path}`

  return { title, description, url, image }
}