import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Loader2Icon //,
  // LoaderIcon,
  // HeartIcon,
  // SettingsIcon
} from 'lucide-react'
import { useRef, useState } from 'react'

import placeholder from '../assets/placeholder.svg'
import {
  backgroundsQueryOptions,
  launchQueryOptions,
  useBackgroundMutation,
  useResetBackgroundMutation
} from '../data'

export const Route = createFileRoute('/menu')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(backgroundsQueryOptions),
  beforeLoad: async ({ context: { queryClient } }) => {
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
    status: setStatus,
    mutate: setBackground,
    reset: resetSetBackground
  } = useBackgroundMutation({
    onError: () => {
      resetSetBackground()
    }
  })
  const {
    status: resetStatus,
    mutate: resetBackground,
    reset
  } = useResetBackgroundMutation({
    onSuccess: () => {
      resetSetBackground()
    },
    onSettled: () => {
      reset()
    }
  })

  const [activeBackground, setActiveBackground] = useState(data[0])
  const backgroundRefs = useRef<HTMLImageElement[]>([])

  if (dataStatus === 'error') {
    return <div>Error: {dataError?.message}</div>
  }

  const handleSelect = (index: number) => {
    const ref = backgroundRefs.current[index]
    if (!ref || ref.id === activeBackground?.id) return

    setActiveBackground(data[index])
    resetSetBackground()
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
    <motion.div
      className="relative flex h-full w-full flex-col p-6"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
      <div className="relative -mt-6">
        <div className="scrollbar-hide flex h-48 flex-shrink-0 items-center gap-3 overflow-x-auto scroll-smooth px-12">
          {data.map((background, index) => (
            <motion.button
              key={background.id}
              className={clsx(
                'aspect-video shadow-lg transition-[width,height,box-shadow]',
                activeBackground.id === background.id
                  ? 'h-36 w-64 rounded-xl shadow-orange-600/20'
                  : 'h-28 w-52 rounded-lg shadow-orange-600/10 hover:shadow-orange-600/20'
              )}
              initial={{ transform: 'scale(.9)' }}
              whileInView={{ transform: 'scale(1)' }}
              whileHover={{
                transform:
                  activeBackground.id === background.id
                    ? 'scale(1)'
                    : 'scale(1.05)',
                transition: { duration: 0.2 }
              }}
              whileTap={{
                transform: 'scale(1)',
                transition: { duration: 0.2 }
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              tabIndex={-1}
            >
              <img
                id={background.id}
                alt={background.name}
                className={clsx(
                  'h-full w-full select-none object-cover transition-[border-radius]',
                  activeBackground.id === background.id
                    ? 'rounded-xl'
                    : 'rounded-lg'
                )}
                src={`/backgrounds/${background.image}`}
                ref={(el) => (backgroundRefs.current[index] = el!)}
                onClick={() => handleSelect(index)}
                onError={onImageError}
                draggable="false"
              />
              <div
                className={clsx(
                  'absolute bottom-0 left-0 right-0 transform-gpu select-none truncate text-ellipsis bg-gradient-to-t from-zinc-950/50 to-transparent p-1 text-center font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] transition-[font-size,border-radius] will-change-transform',
                  activeBackground.id === background.id
                    ? 'rounded-b-xl text-sm'
                    : 'rounded-b-lg py-1.5 text-xs'
                )}
              >
                {background.name}
              </div>
            </motion.button>
          ))}
        </div>
        <motion.div
          className="absolute left-1 top-1/2 -mt-4"
          initial={{ transform: 'translateX(15px)' }}
          animate={{ transform: 'translateX(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <button
            className="group rounded-full transition-transform will-change-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none active:scale-95"
            onClick={() => handleNavigate('prev')}
          >
            <div className="rounded-full bg-zinc-800/70 p-1 backdrop-blur transition-[box-shadow] group-focus-visible:ring-2 group-focus-visible:ring-white">
              <ChevronLeft size={24} className="text-white" />
            </div>
          </button>
        </motion.div>
        <motion.div
          className="absolute right-1 top-1/2 -mt-4"
          initial={{ transform: 'translateX(-15px)' }}
          animate={{ transform: 'translateX(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <button
            className="group rounded-full transition-transform will-change-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none active:scale-95"
            onClick={() => handleNavigate('next')}
          >
            <div className="rounded-full bg-zinc-800/70 p-1 backdrop-blur group-focus-visible:ring-2 group-focus-visible:ring-white">
              <ChevronRight size={24} className="text-white" />
            </div>
          </button>
        </motion.div>
      </div>
      <motion.div
        className="relative flex h-full min-h-0 w-full flex-1 justify-center"
        initial={{ transform: 'scale(.95)' }}
        whileInView={{ transform: 'scale(1)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute left-0 top-0 flex h-fit w-fit gap-2 p-3 text-sm text-zinc-200">
          {activeBackground.tags.map((tag) => (
            <motion.p
              key={tag}
              className="rounded-md border border-zinc-800/80 bg-zinc-700/80 px-2.5 py-1 font-medium text-white backdrop-blur will-change-transform"
              initial={{ opacity: 0, transform: 'translateY(-8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              transition={{ duration: 0.2 }}
            >
              {tag}
            </motion.p>
          ))}
        </div>
        <img
          alt="Selected Wallpaper"
          className="h-full w-[61rem] select-none rounded-lg object-cover" //w-[55rem]
          src={`/backgrounds/${activeBackground.image}`}
          onError={onImageError}
          draggable="false"
        />
        <div className="absolute bottom-0 flex w-full items-center gap-5 bg-gradient-to-b from-transparent to-zinc-950/50 to-25% p-4 pt-8">
          <motion.div
            key={activeBackground.id}
            className="flex select-none flex-col"
            initial={{ opacity: 0, transform: 'translateY(8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-bold">{activeBackground.name}</h1>
            <p className="text-lg">{activeBackground.description}</p>
          </motion.div>
          <button
            className={clsx(
              'relative ml-auto h-14 w-48 select-none text-center text-lg font-medium uppercase tracking-wider transition-[color,transform] will-change-transform hover:text-zinc-300 focus-visible:text-zinc-300 focus-visible:outline-none active:scale-95 disabled:pointer-events-none',
              resetStatus === 'idle' &&
                'underline-fade-in after:bottom-4 after:left-3 after:right-3 after:w-[calc(100%-1.5rem)] after:bg-zinc-300'
            )}
            onClick={() => {
              if (resetStatus === 'pending') return
              resetBackground()
            }}
            disabled={resetStatus !== 'idle'}
          >
            <AnimatePresence mode="wait">
              {resetStatus === 'pending' || resetStatus === 'success' ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="loader"
                  className=""
                >
                  <Loader2Icon className="mx-auto animate-spin" size={28} />
                </motion.span>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="idle"
                >
                  Reset to Default
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {/* <button className="group rounded-full border-2 border-orange-900/50 bg-orange-950 p-3.5 text-orange-100 shadow-md ring-white transition-[border-color,transform,fill] will-change-transform hover:scale-105 hover:border-white focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 active:scale-95 active:border-orange-200 active:ring-orange-200">
            <HeartIcon
              size={24}
              className="fill-transparent transition-colors group-hover:fill-current group-focus-visible:fill-current group-active:fill-orange-200 group-active:stroke-orange-200"
            />
          </button> */}
          <button
            className="h-14 w-40 select-none rounded-[0.2rem] border-2 border-orange-800/40 bg-orange-500 px-10 text-center text-lg font-medium uppercase tracking-wider text-orange-50 shadow-md ring-orange-50 transition-[border-color,transform,border-radius] will-change-transform hover:scale-105 hover:rounded-[0.25rem] hover:border-orange-50 focus-visible:scale-105 focus-visible:border-orange-50 focus-visible:outline-none focus-visible:ring-1 active:scale-95 disabled:pointer-events-none"
            onClick={() => setBackground({ id: activeBackground.id })}
            disabled={setStatus !== 'idle'}
          >
            <AnimatePresence mode="wait">
              {setStatus === 'pending' || setStatus === 'error' ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="loader"
                >
                  <Loader2Icon
                    className="mx-auto animate-spin text-orange-200"
                    size={28}
                  />
                </motion.span>
              ) : setStatus === 'success' ? (
                <motion.span
                  className="text-orange-100"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="success"
                >
                  Applied
                </motion.span>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="idle"
                >
                  Apply
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
