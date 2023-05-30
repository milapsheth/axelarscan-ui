import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { DatePicker } from 'antd'
import _ from 'lodash'
import moment from 'moment'
import { BiX } from 'react-icons/bi'

import Modal from '../modal'
import { searchTransactions } from '../../lib/api/axelar'
import { toArray, getQueryParams, createDayJSFromUnixtime } from '../../lib/utils'

export default () => {
  const router = useRouter()
  const { pathname, asPath, query } = { ...router }

  const [filters, setFilters] = useState(null)
  const [filterTrigger, setFilterTrigger] = useState(undefined)
  const [types, setTypes] = useState(null)
  const [hidden, setHidden] = useState(true)

  useEffect(
    () => {
      const getData = async () => {
        const response = await searchTransactions({ aggs: { types: { terms: { field: 'types.keyword', size: 100 } } }, size: 0 })
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
      label: 'Transaction Hash',
      name: 'txHash',
      type: 'text',
      placeholder: 'Transaction Hash',
      className: 'col-span-2',
    },
    {
      label: 'Transaction Type',
      name: 'type',
      type: 'select',
      placeholder: 'Select transaction type',
      options: _.concat({ value: '', title: 'Any' }, _.orderBy(toArray(types).map(t => { return { value: t, title: t } }), ['title'], ['asc'])),
    },
    {
      label: 'Status',
      name: 'status',
      type: 'select',
      placeholder: 'Select transaction status',
      options: [
        {
          value: '',
          title: 'Any',
        },
        {
          value: 'success',
          title: 'Success',
        },
        {
          value: 'failed',
          title: 'Failed',
        },
      ],
    },
    {
      label: 'Address',
      name: 'address',
      type: 'text',
      placeholder: 'Axelar Address',
      className: 'col-span-2',
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
      buttonClassName={`max-w-min ${filtered ? 'border-2 border-blue-500 dark:border-slate-200 text-blue-500 dark:text-slate-200 font-semibold py-0.5 px-2' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 font-normal py-1 px-2.5'} rounded text-sm sm:text-base`}
      title={
        <div className="flex items-center justify-between">
          <span>
            Filter Transactions
          </span>
          <div
            onClick={
              () => {
                setHidden(true)
                setFilters({ ...getQueryParams(asPath) })
              }
            }
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
                      const { title, value } = { ...o }
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
                      value={filters?.fromTime && filters.toTime ? [createDayJSFromUnixtime(filters.fromTime), createDayJSFromUnixtime(filters.toTime)] : undefined}
                      onChange={v => setFilters({ ...filters, fromTime: _.head(v) && moment(_.head(v).valueOf()).unix(), toTime: _.last(v) && moment(_.last(v).valueOf()).unix() })}
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