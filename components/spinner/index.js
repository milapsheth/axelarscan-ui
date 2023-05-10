import { useSelector, shallowEqual } from 'react-redux'
import { Blocks, Oval } from 'react-loader-spinner'

import { loaderColor } from '../../lib/utils'

export default (
  {
    name,
    width = 24,
    height = 24,
  },
) => {
  const {
    preferences,
  } = useSelector(state => ({ preferences: state.preferences }), shallowEqual)
  const {
    theme,
  } = { ...preferences }

  const color = loaderColor(theme)
  let spinner

  switch (name) {
    case 'Blocks':
      return <Blocks />
    case 'Oval':
    default:
      return <Oval width={width} height={height} color={color} />
  }
}