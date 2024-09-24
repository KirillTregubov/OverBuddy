import type { MouseEvent } from 'react'

export const linkFix = {
  onAuxClick: (e: MouseEvent<'a'>) => e.preventDefault(),
  onClick: (e: MouseEvent<'a'>) => {
    if (e.ctrlKey || e.altKey) e.preventDefault()
  }
}

export const anchorLinkFix = {
  onAuxClick: (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
  onClick: (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.altKey) e.preventDefault()
    if (e.button === 1) e.preventDefault()
  }
}
