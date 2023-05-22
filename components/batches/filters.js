import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { DatePicker } from 'antd'
import _ from 'lodash'
import moment from 'moment'
import { BiX } from 'react-icons/bi'

import Modal from '../modal'
import { searchBatches } from '../../lib/api/batches'
import { toArray, getQueryParams, createMomentFromUnixtime } from '../../lib/utils'

export default () => {
  const {
    chains,
  } = useSelector(state => ({ chains: state.chains }), shallowEqual)
  const {
    chains_data,
  } = { ...chains }

  const router = useRouter()
  const {
    pathname,
    asPath,
    query,
  } = { ...router }

  const [filters, setFilters] = useState(null)
  const [filterTrigger, setFilterTrigger] = useState(undefined)
  const [types, setTypes] = useState(null)
  const [hidden, setHidden] = useState(true)

  useEffect(
    () => {
      const getData = async () => {
        const response = await searchBatches({ aggs: { types: { terms: { field: 'commands.type.keyword', size: 100 } } }, size: 0 })
        setTypes(toArray(response).map(d => d.key))
      }
      getData()
    },
    [],
  )

  useEffect(
    () => {
      if (asPath) {
        setFilters({ ...getQueryParams(asPath) })
      }
    },
    [asPath],
  )

  useEffect(
    () => {
      if (filterTrigger !== undefined) {
        const qs = new URLSearchParams()
        Object.entries({ ...filters }).filter(([k, v]) => v).forEach(([k, v]) => { qs.append(k, v) })
        const qs_string = qs.toString()
        router.push(`${pathname}${qs_string ? `?${qs_string}` : ''}`)
        setHidden(true)
      }
    },
    [filterTrigger],
  )

  const fields = [
    {
      label: 'Batch ID',
      name: 'batchId',
      type: 'text',
      placeholder: 'Batch ID',
      className: 'col-span-2',
    },
    {
      label: 'Command ID',
      name: 'commandId',
      type: 'text',
      placeholder: 'Command ID',
      className: 'col-span-2',
    },
    {
      label: 'Chain',
      name: 'chain',
      type: 'select',
      placeholder: 'Select chain',
      options: _.concat(
        { value: '', title: 'Any' },
        _.orderBy(toArray(chains_data).filter(c => c.chain_type === 'evm' && (!c.no_inflation || c.deprecated)), ['deprecated'], ['desc']).map(c => {
          const {
            id,
            name,
          } = { ...c }

          return {
            value: id,
            title: name,
          }
        }),
      ),
    },
    {
      label: 'Key ID',
      name: 'keyId',
      type: 'text',
      placeholder: 'Key ID',
    },
    {
      label: 'Command Type',
      name: 'type',
      type: 'select',
      placeholder: 'Select command type',
      options: _.concat({ value: '', title: 'Any' }, toArray(types).map(t => { return { value: t, title: t } })),
    },
    {
      label: 'Status',
      name: 'status',
      type: 'select',
      placeholder: 'Select batch status',
      options: [
        {
          value: '',
          title: 'Any',
        },
        {
          value: 'executed',
          title: 'Executed',
        },
        {
          value: 'unexecuted',
          title: 'Unexecuted',
        },
        {
          value: 'signed',
          title: 'Signed',
        },
        {
          value: 'signing',
          title: 'Signing',
        },
        {
          value: 'aborted',
          title: 'Aborted',
        },
      ],
    },
    {
      label: 'Time',
      name: 'time',
      type: 'datetime-range',
      placeholder: 'Select transaction time',
      className: 'col-span-2',
    },
  ]

  const filtered = (!!filterTrigger || filterTrigger === undefined) && Object.keys({ ...query }).length > 0

  return (
    <Modal
      hidden={hidden}
      disabled={!types}
      onClick={() => setHidden(false)}
      buttonTitle={`Filter${filtered ? 'ed' : ''}`}
      buttonClassName={`max-w-min ${filtered ? 'border-2 border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 font-semibold py-0.5 px-2' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 font-normal py-1 px-2.5'} rounded text-sm sm:text-base`}
      title={
        <div className="flex items-center justify-between">
          <span>
            Filter EVM Batches
          </span>
          <div
            onClick={() => setHidden(true)}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-full p-2"
          >
            <BiX size={18} />
          </div>
        </div>
      }
      body={
        <div className="form grid sm:grid-cols-2 gap-x-4 mt-2 -mb-3">
          {fields.map((f, i) => {
            const {
              label,
              name,
              type,
              placeholder,
              options,
              className,
            } = { ...f }

            return (
              <div key={i} className={`form-element ${className || ''}`}>
                {label && (
                  <div className="form-label text-slate-600 dark:text-slate-200 font-normal">
                    {label}
                  </div>
                )}
                {type === 'select' ?
                  <select
                    placeholder={placeholder}
                    value={filters?.[name]}
                    onChange={e => setFilters({ ...filters, [name]: e.target.value })}
                    className="form-select bg-slate-50"
                  >
                    {toArray(options).map((o, i) => {
                      const {
                        title,
                        value,
                      } = { ...o }

                      return (
                        <option
                          key={i}
                          title={title}
                          value={value}
                        >
                          {title}
                        </option>
                      )
                    })}
                  </select> :
                  type === 'datetime-range' ?
                    <DatePicker.RangePicker
                      showTime
                      format="YYYY/MM/DD HH:mm:ss"
                      presets={[
                        { label: 'Today', value: [moment().startOf('day'), moment().endOf('day')] },
                        { label: 'Last 7 Days', value: [moment().subtract(7, 'days').startOf('day'), moment().endOf('day')] },
                        { label: 'This Month', value: [moment().startOf('month'), moment().endOf('month')] },
                        { label: 'Last 30 Days', value: [moment().subtract(30, 'days').startOf('day'), moment().endOf('day')] },
                      ]}
                      value={filters?.fromTime && filters.toTime ? [createMomentFromUnixtime(filters.fromTime), createMomentFromUnixtime(filters.toTime)] : undefined}
                      onChange={v => setFilters({ ...filters, fromTime: moment(_.head(v)).unix(), toTime: moment(_.last(v)).unix() })}
                      className="form-input"
                      style={{ display: 'flex' }}
                    /> :
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={filters?.[name]}
                      onChange={e => setFilters({ ...filters, [name]: e.target.value })}
                      className="form-input"
                    />
                }
              </div>
            )
          })}
        </div>
      }
      noCancelOnClickOutside={true}
      onCancel={
        () => {
          setFilters(null)
          setFilterTrigger(typeof filterTrigger === 'boolean' ? null : false)
        }
      }
      cancelButtonTitle="Reset"
      onConfirm={() => setFilterTrigger(moment().valueOf())}
      confirmButtonTitle="Search"
    />
  )
}