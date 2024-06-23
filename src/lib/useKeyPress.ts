import { useCallback, useEffect, useRef } from 'react'

type Key =
  | { key: string; keys?: undefined }
  | { key?: undefined; keys: string[] }

type useKeyPressProps = {
  onPress: (event: KeyboardEvent) => void
  debounce?: number
} & Key

export default function useKeyPress({
  key = undefined,
  keys = undefined,
  onPress,
  debounce = 0
}: useKeyPressProps) {
  const lastPressTimeRef = useRef<number>(0)
  const handleEscapePress = useCallback(
    (event: KeyboardEvent) => {
      const currentTime = Date.now()
      if (currentTime - lastPressTimeRef.current < debounce) {
        return
      }
      lastPressTimeRef.current = currentTime

      if (key !== undefined) {
        if (event.key === key) onPress(event)
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) onPress(event)
      }
    },
    [key, keys, onPress, debounce]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleEscapePress)

    return () => {
      document.removeEventListener('keydown', handleEscapePress)
    }
  }, [handleEscapePress])
}
