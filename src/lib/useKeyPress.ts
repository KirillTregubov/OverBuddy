import { useCallback, useEffect } from 'react'

type Key =
  | { key: string; keys?: undefined }
  | { key?: undefined; keys: string[] }

type useKeyPressProps = {
  onPress: (event: KeyboardEvent) => void
} & Key

export default function useKeyPress({
  key = undefined,
  keys = undefined,
  onPress
}: useKeyPressProps) {
  const handleEscapePress = useCallback(
    (event: KeyboardEvent) => {
      if (key !== undefined) {
        if (event.key === key) onPress(event)
      } else if (keys !== undefined) {
        if (keys.includes(event.key)) onPress(event)
      }
    },
    [key, keys, onPress]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleEscapePress)

    return () => {
      document.removeEventListener('keydown', handleEscapePress)
    }
  }, [handleEscapePress])
}
