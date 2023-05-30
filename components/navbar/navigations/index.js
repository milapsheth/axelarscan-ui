import Link from 'next/link'
import { useRouter } from 'next/router'

import routes from './routes'
import { toArray } from '../../../lib/utils'

export default () => {
  const router = useRouter()
  const { pathname } = { ...router }

  return (
    <div className="hidden xl:flex items-center xl:space-x-6 mx-auto">
      {routes.map((r, i) => {
        const { disabled, title, path, others_paths } = { ...r }
        const external = !path?.startsWith('/')
        const selected = !external && (pathname === path || toArray(others_paths).includes(pathname))
        const item = (
          <span className="whitespace-nowrap">
            {title}
          </span>
        )
        const className = `${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} flex items-center uppercase ${selected ? 'text-blue-600 dark:text-white text-sm font-bold' : 'text-slate-700 hover:text-blue-400 dark:text-slate-200 dark:hover:text-slate-100 text-sm font-medium'} space-x-1.5`
        return (
          external ?
            <a
              key={i}
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {item}
            </a> :
            <Link
              key={i}
              href={path}
            >
              <div className={className}>
                {item}
              </div>
            </Link>
        )
      })}
    </div>
  )
}