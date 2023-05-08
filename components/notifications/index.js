import { useState, useEffect } from 'react'
import { BiX } from 'react-icons/bi'

import Portal from '../modal/portal'

export default (
  {
    visible = true,
    hidden = false,
    outerClassNames,
    innerClassNames,
    animation,
    btnTitle,
    btnClassNames,
    icon,
    content,
    onClose,
  },
) => {
  const [open, setOpen] = useState(visible)

  const show = () => setOpen(true)

  const hide = () => {
    setOpen(false)
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {!hidden && (
        <button
          type="button"
          onClick={show}
          className={`${btnClassNames}`}
        >
          {btnTitle}
        </button>
      )}
      {open && (
        <Portal selector="#portal">
          <div className={`${visible ? animation : ''} ${outerClassNames}`}>
            <div className={`w-full flex items-center justify-start p-4 ${innerClassNames}`}>
              {icon && (
                <div className="flex-shrink">
                  {icon}
                </div>
              )}
              <div className="flex-grow">
                {content}
              </div>
              <div className="flex-shrink">
                <button
                  onClick={hide}
                  className="flex items-center justify-center ml-auto"
                >
                  <BiX className="w-4 h-4 stroke-current ml-2" />
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}