import { Background } from '@/lib/schemas'

const BACKGROUND_PRELOAD_COUNT = 6

export const getNearestBackgrounds = (
  backgrounds: Background[],
  index: number,
  count: number = BACKGROUND_PRELOAD_COUNT,
) => {
  if (backgrounds.length === 0 || count <= 0) return []

  const preloadCount = Math.min(count, backgrounds.length)
  const safeIndex = Math.min(
    Math.max(Number.isInteger(index) ? index : 0, 0),
    backgrounds.length - 1,
  )

  let start = safeIndex - Math.floor((preloadCount - 1) / 2)
  let end = start + preloadCount

  if (start < 0) {
    start = 0
    end = preloadCount
  } else if (end > backgrounds.length) {
    end = backgrounds.length
    start = end - preloadCount
  }

  return backgrounds.slice(start, end)
}

export const preloadBackgroundImage = async (image: string) => {
  const img = new Image()
  img.decoding = 'async'
  img.src = `/backgrounds/${image}`

  if (typeof img.decode === 'function') {
    await img.decode().catch(() => undefined)
    return
  }

  if (img.complete) return

  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.onerror = () => resolve()
  })
}
