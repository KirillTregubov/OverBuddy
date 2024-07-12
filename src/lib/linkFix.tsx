import type { MouseEvent } from 'react'

const linkFix = {
  onAuxClick: (e: MouseEvent<'a'>) => e.preventDefault(),
  onClick: (e: MouseEvent<'a'>) => {
    if (e.ctrlKey || e.altKey) e.preventDefault()
  }
}

export default linkFix
