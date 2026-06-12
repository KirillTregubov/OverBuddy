import { useCallback, useSyncExternalStore } from 'react'

export const useIsOverflow = (
  ref: React.RefObject<HTMLElement | null>,
  callback?: (isOverflow: boolean) => void,
) => {
  const getSnapshot = useCallback(() => {
    const { current } = ref
    if (!current) return null

    return current.scrollWidth > current.clientWidth
  }, [ref])

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { current } = ref
      if (!current) return () => {}

      const trigger = () => {
        onStoreChange()
        callback?.(current.scrollWidth > current.clientWidth)
      }
      const observer =
        'ResizeObserver' in window ? new ResizeObserver(trigger) : undefined

      observer?.observe(current)
      trigger()

      return () => observer?.disconnect()
    },
    [callback, ref],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
