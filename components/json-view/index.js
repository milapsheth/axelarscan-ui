import { toJson } from '../../lib/utils'

export default (
  {
    value,
    className = 'max-w-xs sm:max-w-xl max-h-96 overflow-y-auto whitespace-pre text-sm',
    tab = 4,
  },
) => {
  return typeof toJson(value) === 'object' && (
    <div className={className}>
      {JSON.stringify(toJson(value), null, tab)}
    </div>
  )
}