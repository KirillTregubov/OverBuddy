import type { MouseEvent } from 'react'

export const linkFix = {
  onAuxClick: (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
  onClick: (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.altKey) e.preventDefault()
  }
}
