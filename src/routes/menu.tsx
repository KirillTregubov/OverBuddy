import { FileRoute, redirect } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import clsx from 'clsx'
import {
  ChevronLeft,
  ChevronRight,
  HeartIcon,
  SettingsIcon
} from 'lucide-react'
import {
  useBackgroundsMutation,
  backgroundsQueryOptions,
  launchQueryOptions
} from '../data'
import placeholder from '../assets/placeholder.svg'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = new FileRoute('/menu').createRoute({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(backgroundsQueryOptions),
  beforeLoad: async ({ context: { queryClient } }) => {
    console.log('loaded menu')
    const { is_setup } = await queryClient.fetchQuery(launchQueryOptions)
    if (!is_setup) {
      throw redirect({ to: '/setup' })
    }
  },
  component: Menu
})
const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (!event?.target) return
  ;(event.target as HTMLImageElement).src = placeholder
}

function Menu() {
  const {
    status: dataStatus,
    error: dataError,
    data
  } = useSuspenseQuery(backgroundsQueryOptions)
  const {
    status: mutationStatus,
    mutate,
    reset: resetMutation
  } = useBackgroundsMutation()

  const [activeBackground, setActiveBackground] = useState(data[0])
  const backgroundRefs = useRef<HTMLImageElement[]>([])

  if (dataStatus === 'error') {
    return <div>Error: {dataError?.message}</div>
  }

  const handleSelect = (index: number) => {
    const ref = backgroundRefs.current[index]
    if (!ref || ref.id === activeBackground?.id) return

    setActiveBackground(data[index])
    resetMutation()
    if (ref) {
      ref.scrollIntoView({
        behavior: 'smooth',
        inline: 'center'
      })
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!activeBackground) return
    const currentIndex = data.findIndex((bg) => bg.id === activeBackground.id)
    let newIndex

    if (direction === 'prev') {
      newIndex = currentIndex - 1 < 0 ? data.length - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex + 1 >= data.length ? 0 : currentIndex + 1
    }

    handleSelect(newIndex)
  }

  return (
    <div className="relative flex h-full w-full flex-col gap-4 p-6">
      {/* <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Main Menu <span className="font-medium">Customizer</span>
        </h1>
        <button className="rounded-full bg-transparent p-2 transition-colors hover:bg-zinc-700/70 active:bg-zinc-600">
          <SettingsIcon
            size={24}
            className="hover:animate-spin-cog rotate-[30deg] transition-transform will-change-transform"
          />
        </button>
      </div> */}
      <div className="relative -mt-2">
        <div className="scrollbar-hide flex h-40 flex-shrink-0 items-center gap-3 overflow-x-auto scroll-smooth px-12">
          {data.map((background, index) => (
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
          className="absolute left-1 top-1/2 -translate-y-1/2 transform cursor-pointer rounded-full bg-zinc-800/90 p-1 mix-blend-luminosity"
          onClick={() => handleNavigate('prev')}
        >
          <ChevronLeft size={24} className="text-white" />
        </div>
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2 transform cursor-pointer  rounded-full bg-zinc-800/90 p-1 mix-blend-luminosity"
          onClick={() => handleNavigate('next')}
        >
          <ChevronRight size={24} className="text-zinc-100" />
        </div>
      </div>
      <div className="relative flex h-full min-h-0 w-full flex-1 justify-center">
        <img
          alt="Selected Wallpaper"
          className="h-full w-[61rem] select-none rounded-lg object-cover" //w-[55rem]
          src={`/backgrounds/${activeBackground.image}`}
          onError={onImageError}
        />
        <div className="absolute bottom-0 flex w-full items-center gap-4 bg-gradient-to-b from-transparent to-zinc-950/50 to-25% p-4 pt-8">
          <button className="group ml-auto rounded-full border-2 border-orange-900 bg-orange-950 p-3.5 text-orange-100 shadow-md transition-[border-color,transform,fill] will-change-transform hover:scale-105 hover:border-white focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95">
            {/* text-orange-100    */}
            <HeartIcon
              size={24}
              className="fill-transparent transition-colors group-hover:fill-current group-focus-visible:fill-current group-active:fill-orange-200 group-active:stroke-orange-200"
            />
            {/* fill="currentColor" */}
          </button>
          <button
            className="select-none rounded-[0.2rem] border-2 border-orange-800/40 bg-orange-500 px-10 py-3 text-lg font-medium uppercase tracking-wider text-white shadow-md transition-[border-color,transform,border-radius] will-change-transform hover:scale-105 hover:rounded-[0.25rem] hover:border-white focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
            onClick={() => mutate({ id: activeBackground.id })}
          >
            {mutationStatus === 'pending' ? (
              <>Applying...</>
            ) : mutationStatus === 'success' ? (
              'Applied'
            ) : (
              'Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
