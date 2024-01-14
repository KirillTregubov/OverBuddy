import { useRef, useEffect } from 'react'

export function useHorizontalDivScroll() {
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = elRef.current

    if (el) {
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return
        e.preventDefault()

        el.scrollTo({
          left: el.scrollLeft + e.deltaY * 4,
          behavior: 'smooth'
        })
      }

      el.addEventListener('wheel', onWheel)

      return () => {
        el.removeEventListener('wheel', onWheel)
      }
    }
  }, [])

  return elRef
}
