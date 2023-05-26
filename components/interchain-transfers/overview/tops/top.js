import { useSelector, shallowEqual } from 'react-redux'
import { Card, CardBody, Tooltip } from '@material-tailwind/react'
import _ from 'lodash'

import Spinner from '../../../spinner'
import NumberDisplay from '../../../number'
import Image from '../../../image'
import { getChainData } from '../../../../lib/config'
import { split, toArray } from '../../../../lib/utils'

export default (
  {
    data,
    field = 'num_txs',
    title = '',
    description = '',
    numberFormat = '0,0',
    prefix = '',
  },
) => {
  const {
    chains,
  } = useSelector(state => ({ chains: state.chains }), shallowEqual)
  const {
    chains_data,
  } = { ...chains }

  return (
    <Card className="card">
      <CardBody className="space-y-1.5 p-3">
        <div className="flex flex-col">
          <span className="text-black dark:text-white text-sm font-medium">
            {title}
          </span>
          {description && (
            <span className="text-slate-400 dark:text-slate-500 text-xs">
              {description}
            </span>
          )}
        </div>
        <div className="w-full">
          {data ?
            <div className="space-y-1">
              {toArray(data).map((d, i) => (
                <div key={i} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-1">
                    {split(d.key, 'normal', '_').map((k, j) => {
                      const {
                        name,
                        image,
                      } = { ...getChainData(k, chains_data) }

                      return (
                        <Tooltip key={j} content={name}>
                          <div>
                            <Image
                              src={image}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          </div>
                        </Tooltip>
                      )
                    })}
                  </div>
                  <NumberDisplay
                    value={d[field]}
                    format={numberFormat}
                    prefix={prefix}
                    className="text-black dark:text-white text-xs font-medium"
                  />
                </div>
              ))}
            </div> :
            <div className="w-full h-full flex items-center justify-center">
              <Spinner name="ProgressBar" width={36} height={36} />
            </div>
          }
        </div>
      </CardBody>
    </Card>
  )
}