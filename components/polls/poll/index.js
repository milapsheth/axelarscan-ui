import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import _ from 'lodash'

import Info from './info'
import Votes from './votes'
import Spinner from '../../spinner'
import NumberDisplay from '../../number'
import { searchPolls } from '../../../lib/api/polls'
import { getBlock, getTransactions, getTransaction } from '../../../lib/api/lcd'
import { toArray, getTitle, equalsIgnoreCase } from '../../../lib/utils'

export default () => {
  const router = useRouter()
  const { query } = { ...router }
  const { id } = { ...query }

  const [data, setData] = useState(null)

  useEffect(
    () => {
      const getData = async () => {
        if (id) {
          const { data } = { ...await searchPolls({ pollId: id }) }
          const _d = {}
          const votes = []

          Object.entries({ ..._.head(data) }).forEach(([k, v]) => {
            if (k) {
              if (k.startsWith('axelar')) {
                votes.push(v)
              }
              else {
                _d[k] = v
              }
            }
          })

          setData({ ..._d, votes: _.orderBy(votes, ['height', 'created_at'], ['desc', 'desc']) })

          const { event, height, participants } = { ..._d }
          const confirmation_vote = votes.find(v => v.confirmed)

          if (height && (!confirmation_vote || votes.length < toArray(participants).length)) {
            for (const i of _.range(-3, 6)) {
              const h = height + i
              getBlock(h, { index: true })
              await getTransactions({ index: true, events: `tx.height=${h}` })
            }
          }

          if (!event && confirmation_vote?.id) {
            getTransaction(confirmation_vote.id, { index: true })
          }
        }
      }

      getData()
      const interval = setInterval(() => getData(), 5 * 60 * 1000)
      return () => clearInterval(interval)
    },
    [id],
  )

  const { participants, votes } = { ...data }
  const matched = equalsIgnoreCase(id, data?.id)
  let vote_options =
    Object.entries(_.groupBy(toArray(matched && votes).map(v => { return { ...v, option: v.vote ? 'yes' : typeof v.vote === 'boolean' ? 'no' : 'unsubmitted' } }), 'option'))
      .map(([k, v]) => {
        return {
          option: k,
          value: toArray(v).length,
        }
      })
      .filter(v => v.value)
      .map(v => {
        const { option } = { ...v }
        return {
          ...v,
          i: option === 'yes' ? 0 : option === 'no' ? 1 : 2,
        }
      })
  if (matched && toArray(participants).length > 0 && vote_options.findIndex(v => v.option === 'unsubmitted') < 0 && _.sumBy(vote_options, 'value') < toArray(participants).length) {
    vote_options.push({ option: 'unsubmitted', value: participants.length - _.sumBy(vote_options, 'value') })
  }
  vote_options = _.orderBy(vote_options, ['i'], ['asc'])

  return (
    <div className="children px-3">
      {data && matched ?
        <div className="max-w-6xl space-y-4 sm:space-y-6 mt-6 sm:mt-8 mx-auto">
          <Info data={data} />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center">
              <span className="capitalize text-base font-medium mr-3">
                votes
              </span>
              {vote_options.map((v, i) => {
                const { option, value } = { ...v }
                return (
                  <NumberDisplay
                    key={i}
                    value={value}
                    format="0,0"
                    suffix={` ${getTitle(option)}`}
                    noTooltip={true}
                    className={`${['no'].includes(option) ? 'bg-red-500 dark:bg-red-600 text-white' : ['yes'].includes(option) ? 'bg-green-500 dark:bg-green-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500'} rounded-lg capitalize text-sm font-medium mr-2 py-1.5 px-2`}
                  />
                )
              })}
            </div>
            <Votes data={data} />
          </div>
        </div> :
        <div className="loading">
          <Spinner name="Blocks" />
        </div>
      }
    </div>
  )
}