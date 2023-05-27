import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'

import TimeSpent from './time-spent'
import { getChainData } from '../../../../lib/config'
import { toArray } from '../../../../lib/utils'

export default ({ data }) => {
  const {
    chains,
  } = useSelector(state => ({ chains: state.chains }), shallowEqual)
  const {
    chains_data,
  } = { ...chains }

  const {
    GMPStatsAVGTimes,
  } = { ...data }

  const {
    time_spents,
  } = { ...GMPStatsAVGTimes }

  const render = d => {
    return null
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {toArray(time_spents).map(t => render(t))}
    </div>
  )
}