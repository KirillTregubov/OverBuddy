import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Background = {
  id: string
  image: string
  name: string
}

const backgrounds: Background[] = [
  {
    id: '0x0800000000000E77',
    image: 'heroes.jpg',
    name: 'Heroes'
  },
  {
    id: '0x0800000000000EFB',
    image: 'zero_hour.jpg',
    name: 'Zero Hour'
  },
  {
    id: '0x0800000000000D6C',
    image: 'sojourn.jpg',
    name: 'Sojourn'
  },
  {
    id: '0x0800000000000EF3',
    image: 'kiriko.jpg',
    name: 'Kiriko'
  },
  {
    id: '0x0800000000000E771',
    image: 'heroes.jpg',
    name: 'Heroes'
  },
  {
    id: '0x0800000000000EFB1',
    image: 'zero_hour.jpg',
    name: 'Zero Hour'
  },
  {
    id: '0x0800000000000D6C1',
    image: 'sojourn.jpg',
    name: 'Sojourn'
  },
  {
    id: '0x0800000000000EF31',
    image: 'kiriko.jpg',
    name: 'Kiriko'
  }
]

export default function Menu() {
  const [activeBackground, setActiveBackground] = useState<null | Background>(
    backgrounds[0]
  )
  const wallpaperRefs = backgrounds.map(() => useRef<HTMLImageElement>(null))

  //   useEffect(() => {
  //     console.log('changing')
  //     if (!wallpaperRefs.length || wallpaperRefs.length === 0) return
  //     setActiveBackground(backgrounds[0])
  //   }, [wallpaperRefs])

  const handleSelect = (index: number) => {
    const ref = wallpaperRefs[index].current
    if (!ref || ref.id === activeBackground?.id) return

    setActiveBackground(backgrounds[index])
    if (ref) {
      ref.scrollIntoView({
        behavior: 'smooth',
        inline: 'center'
      })
      console.log('scrolling')
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!activeBackground) return
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

  if (!activeBackground) return null

  return (
    <div className="relative flex h-screen max-h-screen flex-col bg-neutral-950 p-4">
      {/* <div className="flex h-full w-full rounded-lg bg-red-500"></div> */}
      <img
        alt="Selected Wallpaper"
        className="flex-shrink-1 h-full min-h-0 w-full rounded-lg object-cover"
        src={`/backgrounds/${activeBackground.image}`}
      />
      <div className="relative -mb-2 mt-1">
        <div className="scrollbar-hide flex h-40 flex-shrink-0 items-center gap-3 overflow-x-auto scroll-smooth px-10">
          {backgrounds.map((background, index) => (
            <img
              id={background.id}
              key={background.id}
              alt={background.name}
              className={clsx(
                'aspect-video cursor-pointer select-none snap-center rounded-lg object-cover shadow-orange-600/20 drop-shadow-md transition-[width,height,border-radius,box-shadow]',
                activeBackground.id === background.id
                  ? 'w-60 rounded-xl shadow-md'
                  : 'w-52 shadow-sm'
              )}
              src={`/backgrounds/${background.image}`}
              ref={wallpaperRefs[index]}
              onClick={() => handleSelect(index)}
            />
          ))}
        </div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 transform cursor-pointer rounded-full bg-neutral-800/85 p-1 mix-blend-luminosity"
          onClick={() => handleNavigate('prev')}
        >
          <ChevronLeft size={24} className="text-white" />
        </div>
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 transform cursor-pointer  rounded-full bg-neutral-800/85 p-1 mix-blend-luminosity"
          onClick={() => handleNavigate('next')}
        >
          <ChevronRight size={24} className="text-neutral-100" />
        </div>
      </div>
    </div>
  )
}
