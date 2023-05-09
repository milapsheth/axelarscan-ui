import Linkify from 'react-linkify'
import parse from 'html-react-parser'

import Logo from './logo'
import DropdownNavigations from './navigations/dropdown'
import Navigations from './navigations'
// import Search from './search'
import Theme from './theme'

export default () => {
  return (
    <>
      <div className="navbar 3xl:pt-6">
        <div className="navbar-inner w-full sm:h-20 flex lg:grid lg:grid-flow-row lg:grid-cols-5 items-center justify-between gap-4">
          <div className="flex items-center">
            <Logo />
            <DropdownNavigations />
          </div>
          <div className="lg:col-span-3 flex items-center justify-center">
            <Navigations />
          </div>
          <div className="flex items-center justify-end 3xl:space-x-4">
            {/*<Search />*/}
            <Theme />
          </div>
        </div>
      </div>
      {process.env.NEXT_PUBLIC_STATUS_MESSAGE && (
        <div className="w-full bg-blue-400 dark:bg-blue-500 overflow-x-auto flex items-center py-2 sm:py-3 3xl:py-4 px-2 sm:px-4 3xl:px-6">
          <div className="flex flex-wrap items-center text-white text-2xs xl:text-sm 3xl:text-2xl font-semibold space-x-1.5 xl:space-x-2 3xl:space-x-3 mx-auto">
            <span className="status-message">
              <Linkify>
                {parse(process.env.NEXT_PUBLIC_STATUS_MESSAGE)}
              </Linkify>
            </span>
          </div>
        </div>
      )}
    </>
  )
}