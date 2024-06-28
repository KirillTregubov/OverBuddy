import { useCallback, useEffect, useRef, useState } from 'react'

type Key =
  | { key: string; keys?: undefined }
  | { key?: undefined; keys: string[] }

type useKeyPressProps = {
  onPress: (event: KeyboardEvent) => void
  onPressEnd?: (event: KeyboardEvent) => void
  debounce?: number
  mode?: 'keydown' | 'keyup'
  capture?: boolean
} & Key

export default function useKeyPress({
  key = undefined,
  keys = undefined,
  mode = 'keydown',
  onPress,
  onPressEnd,
  debounce = 0,
  capture = false
}: useKeyPressProps) {
  const lastPressTimeRef = useRef<number>(0)
  const [pressed, setPressed] = useState(false)

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
          if (mode === 'keydown') onPress(event)
        }
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) {
          setPressed(true)
          if (mode === 'keydown') onPress(event)
        }
      }
    },
    [key, keys, mode, onPress, debounce]
  )

  const handleKeyRelease = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return
      if (key !== undefined) {
        if (event.key === key) {
          setPressed(false)
          if (mode === 'keyup') onPress(event)
          if (onPressEnd) onPressEnd(event)
        }
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) {
          setPressed(false)
          if (mode === 'keyup') onPress(event)
          if (onPressEnd) onPressEnd(event)
        }
      }
    },
    [key, keys, mode, onPress, onPressEnd]
  )

  const preventDefault = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key || keys?.includes(event.key)) {
        event.preventDefault()
      }
    },
    [key, keys]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress, { capture: true })
    document.addEventListener('keyup', handleKeyRelease, { capture: true })
    if (capture) {
      document.body.addEventListener('keydown', preventDefault)
      document.body.addEventListener('keyup', preventDefault)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('keyup', handleKeyRelease)

      if (capture) {
        document.body.removeEventListener('keydown', preventDefault)
        document.body.removeEventListener('keyup', preventDefault)
      }
    }
  }, [handleKeyPress, handleKeyRelease, preventDefault, capture])

  return { pressed }
}
