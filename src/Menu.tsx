import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'

import placeholder from './assets/placeholder.svg'

import { z } from 'zod'

const Background = z.object({
  id: z.string(),
  image: z.string(),
  name: z.string()
})
type Background = z.infer<typeof Background>

const BackgroundArray = z.array(Background)
type BackgroundArray = z.infer<typeof BackgroundArray>

const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (!event?.target) return
  ;(event.target as HTMLImageElement).src = placeholder
}

export default function Menu() {
  const [activeBackground, setActiveBackground] = useState<Background | null>(
    null
  )
  const backgroundRefs = useRef<HTMLImageElement[]>([])

  const {
    status,
    error,
    data: backgrounds
  } = useQuery({
    queryKey: ['backgrounds'],
    queryFn: async () => {
      const data = await invoke('get_backgrounds')
      const backgrounds = BackgroundArray.safeParse(JSON.parse(data as string))
      if (!backgrounds.success) {
        throw new Error(backgrounds.error.message)
      }
      return backgrounds.data
    }
  })
  //   const backgroundRefs =
  //     backgrounds && backgrounds.map(() => useRef<HTMLImageElement>(null))

  useEffect(() => {
    if (status === 'success') {
      setActiveBackground(backgrounds[0])
    }
  }, [status])

  if (status === 'error') {
    return <div>Error: {error?.message}</div>
  }

  if (status === 'pending' || !activeBackground) {
    return <div>Loading...</div>
  }

  const handleSelect = (index: number) => {
    const ref = backgroundRefs.current[index]
    if (!ref || ref.id === activeBackground?.id) return

    setActiveBackground(backgrounds[index])
    if (ref) {
      ref.scrollIntoView({
        behavior: 'smooth',
        inline: 'center'
      })
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = backgrounds.findIndex(
      (bg) => bg.id === activeBackground.id
    )
    let newIndex

    if (direction === 'prev') {
      newIndex =
        currentIndex - 1 < 0 ? backgrounds.length - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex + 1 >= backgrounds.length ? 0 : currentIndex + 1
    }

    handleSelect(newIndex)
  }

  return (
    <div className="relative flex h-screen max-h-screen flex-col gap-4 p-6">
      <div className="relative -mt-2">
        <div className="scrollbar-hide flex h-40 flex-shrink-0 items-center gap-3 overflow-x-auto scroll-smooth px-12">
          {backgrounds.map((background, index) => (
            <img
              id={background.id}
              key={background.id}
              alt={background.name}
              className={clsx(
                'aspect-video cursor-pointer select-none snap-center rounded-lg object-cover shadow-orange-600/15 drop-shadow-md transition-[width,height,border-radius,box-shadow,transform] will-change-transform',
                activeBackground.id === background.id
                  ? 'h-36 w-64 rounded-xl shadow-md'
                  : 'h-28 w-52 shadow-sm hover:scale-105'
              )}
              src={`/backgrounds/${background.image}`}
              ref={(el) => (backgroundRefs.current[index] = el!)}
              onClick={() => handleSelect(index)}
              onError={onImageError}
            />
          ))}
        </div>
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 transform cursor-pointer rounded-full bg-neutral-800/85 p-1 mix-blend-luminosity"
          onClick={() => handleNavigate('prev')}
        >
          <ChevronLeft size={24} className="text-white" />
        </div>
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2 transform cursor-pointer  rounded-full bg-neutral-800/85 p-1 mix-blend-luminosity"
          onClick={() => handleNavigate('next')}
        >
          <ChevronRight size={24} className="text-neutral-100" />
        </div>
      </div>
      <div className="relative flex h-full min-h-0 w-full flex-1 justify-center">
        <img
          alt="Selected Wallpaper"
          className="h-full w-[61rem] select-none rounded-lg object-cover"
          src={`/backgrounds/${activeBackground.image}`}
          onError={onImageError}
        />
        <div className="absolute bottom-4 right-4">
          <button
            className="select-none rounded-[0.2rem] border-2 border-orange-800/40 bg-orange-500 px-10 py-3 text-lg font-medium uppercase tracking-wider text-white shadow-md transition-[border-color,transform,border-radius] will-change-transform hover:scale-105 hover:rounded-[0.25rem] hover:border-white focus-visible:outline-none focus-visible:ring focus-visible:ring-white    active:scale-95"
            // onClick={get_setup}
          >
            Apply
          </button>
          {/* {setup === null ? (
          <p>Click the button to get the setup</p>
        ) : (
          <code>
            <pre>{JSON.stringify(setup, null, 2)}</pre>
          </code>
        )} */}
        </div>
      </div>
    </div>
  )
}
