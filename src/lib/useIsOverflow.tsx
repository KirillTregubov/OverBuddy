import { useLayoutEffect, useState } from 'react'

export const useIsOverflow = (
  ref: React.RefObject<HTMLElement | null>,
  callback?: (isOverflow: boolean) => void
) => {
  const [isOverflow, setIsOverflow] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    const { current } = ref
    if (!current) return

    const trigger = () => {
      const hasOverflow = current.scrollWidth > current.clientWidth // current.scrollHeight > current.clientHeight

      setIsOverflow(hasOverflow)
      if (callback) callback(hasOverflow)
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(trigger).observe(current)
    }

    trigger()
  }, [callback, ref])

  return isOverflow
}
