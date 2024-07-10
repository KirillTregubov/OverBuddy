import { useCallback, useEffect, useRef, useState } from 'react'

type Key =
  | { key: string; keys?: undefined }
  | { key?: undefined; keys: string[] }

type useKeyPressProps = {
  onPress: (event: KeyboardEvent) => void
  onPressEnd?: (event: KeyboardEvent) => void
  debounce?: number
  capture?: boolean
} & Key

export default function useKeyPress({
  key = undefined,
  keys = undefined,
  onPress,
  onPressEnd,
  debounce = 0,
  capture = false
}: useKeyPressProps) {
  const lastPressTimeRef = useRef<number>(0)
  const lastReleaseTimeRef = useRef<number>(0)
  const [pressed, setPressed] = useState(false)
  const preventDefault = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key || keys?.includes(event.key)) {
        event.preventDefault()
      }
    },
    [key, keys]
  )

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const currentTime = Date.now()
      if (currentTime - lastPressTimeRef.current < debounce) {
        return
      }
      if (event.repeat) return
      lastPressTimeRef.current = currentTime

      if (key !== undefined) {
        if (event.key === key) {
          setPressed(true)
          onPress?.(event)
        }
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) {
          setPressed(true)
          onPress?.(event)
        }
      }
    },
    [key, keys, onPress, debounce]
  )

  const handleKeyRelease = useCallback(
    (event: KeyboardEvent) => {
      const currentTime = Date.now()
      if (currentTime - lastReleaseTimeRef.current < debounce) {
        return
      }
      if (event.repeat) return
      lastReleaseTimeRef.current = currentTime

      if (key !== undefined) {
        if (event.key === key) {
          setPressed(false)
          onPressEnd?.(event)
        }
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) {
          setPressed(false)
          onPressEnd?.(event)
        }
      }
    },
    [key, keys, onPressEnd, debounce]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress, { capture: true })
    document.addEventListener('keyup', handleKeyRelease, { capture: true })
    if (capture) {
      document.body.addEventListener('keydown', preventDefault)
      document.body.addEventListener('keyup', preventDefault)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress, { capture: true })
      document.removeEventListener('keyup', handleKeyRelease, { capture: true })

      if (capture) {
        document.body.removeEventListener('keydown', preventDefault)
        document.body.removeEventListener('keyup', preventDefault)
      }
    }
  }, [handleKeyPress, handleKeyRelease, preventDefault, capture])

  return { pressed }
}
