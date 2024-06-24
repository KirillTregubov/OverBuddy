import { useCallback, useEffect, useRef, useState } from 'react'

type Key =
  | { key: string; keys?: undefined }
  | { key?: undefined; keys: string[] }

type useKeyPressProps = {
  onPress: (event: KeyboardEvent) => void
  debounce?: number
  mode?: 'keydown' | 'keyup'
} & Key

export default function useKeyPress({
  key = undefined,
  keys = undefined,
  mode = 'keydown',
  onPress,
  debounce = 0
}: useKeyPressProps) {
  const lastPressTimeRef = useRef<number>(0)
  const [pressed, setPressed] = useState(false)

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const currentTime = Date.now()
      if (currentTime - lastPressTimeRef.current < debounce) {
        return
      }
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
      if (key !== undefined) {
        if (event.key === key) {
          setPressed(false)
          if (mode === 'keyup') onPress(event)
        }
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) {
          setPressed(false)
          if (mode === 'keyup') onPress(event)
        }
      }
    },
    [key, keys, mode, onPress]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    document.addEventListener('keyup', handleKeyRelease)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('keyup', handleKeyRelease)
    }
  }, [handleKeyPress, handleKeyRelease])

  return { pressed }
}
