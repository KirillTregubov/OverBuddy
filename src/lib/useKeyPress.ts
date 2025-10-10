import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type Key =
  | { key: string; keys?: undefined }
  | { key?: undefined; keys: string[] }

type useKeyPressProps = {
  onPress: (event: KeyboardEvent) => void
  onPressEnd?: (event: KeyboardEvent) => void
  debounce?: number
  capture?: boolean
  sharedTimer?: RefObject<number>
  avoidModifiers?: boolean
} & Key

export default function useKeyPress({
  key = undefined,
  keys = undefined,
  onPress,
  onPressEnd,
  debounce = 0,
  capture = false,
  sharedTimer = undefined,
  avoidModifiers = false
}: useKeyPressProps) {
  const lastPressTimeRef = useRef<number>(0)
  const lastReleaseTimeRef = useRef<number>(0)
  const [pressed, setPressed] = useState(false)
  const preventDefault = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key || keys?.includes(event.key)) {
        if (
          avoidModifiers &&
          (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
        )
          return
        event.preventDefault()
      }
    },
    [key, keys, avoidModifiers]
  )

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.repeat ||
        document.querySelector('[data-ignore-global-shortcut]') !== null
      )
        return
      const currentTime = Date.now()
      if (!!sharedTimer && currentTime - sharedTimer.current < debounce) return
      else if (currentTime - lastPressTimeRef.current < debounce) return

      if (key !== undefined && event.key !== key) {
        return
      } else if (keys !== undefined && !keys.includes(event.key)) {
        return
      }
      if (
        avoidModifiers &&
        (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
      )
        return

      lastPressTimeRef.current = currentTime
      if (sharedTimer) {
        // TODO: revisit
        // eslint-disable-next-line react-hooks/immutability
        sharedTimer.current = currentTime
      }
      setPressed(true)
      onPress?.(event)
    },
    [key, keys, avoidModifiers, debounce, onPress, sharedTimer]
  )

  const handleKeyRelease = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.repeat ||
        document.querySelector('[data-ignore-global-shortcut]') !== null
      )
        return
      const currentTime = Date.now()
      if (currentTime - lastReleaseTimeRef.current < debounce) {
        return
      }

      if (key !== undefined && event.key !== key) {
        return
      } else if (keys !== undefined && !keys.includes(event.key)) {
        return
      }

      lastReleaseTimeRef.current = currentTime
      setPressed(false)
      onPressEnd?.(event)
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
