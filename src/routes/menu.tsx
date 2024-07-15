import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import clsx from 'clsx'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  LoaderPinwheel,
  SettingsIcon
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { toast } from 'sonner'

import placeholder from '@/assets/placeholder.svg'
import Loading from '@/components/Loading'
import { MotionLink } from '@/components/Motion'
import { fadeInVariants } from '@/lib/animations'
import {
  activeBackgroundQueryOptions,
  backgroundsQueryOptions,
  launchQueryOptions,
  useActiveBackgroundMutation,
  useBackgroundMutation,
  useResetBackgroundMutation
} from '@/lib/data'
import linkFix from '@/lib/linkFix'
import useKeyPress from '@/lib/useKeyPress'

const buttonTapAnimation = {
  scale: 0.9
}

export const Route = createFileRoute('/menu')({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(backgroundsQueryOptions),
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch(() => {
        throw redirect({ to: '/' })
      })

    if (!is_setup) {
      throw redirect({ to: '/setup' })
    }

    if (steam.enabled && !steam.setup) {
      throw redirect({ to: '/setup/steam_setup' })
    }
  },
  component: Menu,
  pendingComponent: Loading
})

const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (!event?.target) return
  ;(event.target as HTMLImageElement).src = placeholder
}

function Menu() {
  const { data: backgrounds } = useSuspenseQuery(backgroundsQueryOptions)
  const { data: config } = useSuspenseQuery(launchQueryOptions)
  const {
    status: setStatus,
    mutate: setBackground,
    reset: resetSetBackground
  } = useBackgroundMutation()
  const {
    status: resetStatus,
    mutate: resetBackground,
    reset
  } = useResetBackgroundMutation({
    onSuccess: () => resetSetBackground(),
    onSettled: () => reset()
  })
  const backgroundRefs = useRef<HTMLButtonElement[]>([])
  const { data: activeBackground } = useSuspenseQuery(
    activeBackgroundQueryOptions
  )
  const { mutate: setActiveBackground } = useActiveBackgroundMutation()

  const prevButtonRef = useRef<HTMLButtonElement>(null)
  const prevButtonAnimation = useAnimation()
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonAnimation = useAnimation()
  const settingsButtonRef = useRef<HTMLLinkElement>(null)
  const settingsButtonAnimation = useAnimation()

  const sharedTimerRef = useRef<number>(0)
  const onLeftPress = useCallback(
    async (event: KeyboardEvent) => {
      event.preventDefault()
      if (!prevButtonRef.current) return

      prevButtonRef.current?.blur()
      prevButtonRef.current.ariaPressed = 'true'
      await prevButtonAnimation.start(buttonTapAnimation)
      prevButtonRef.current?.click()
      prevButtonRef.current?.focus()
      prevButtonRef.current?.blur()
      prevButtonRef.current.ariaPressed = 'false'
      await prevButtonAnimation.start({ scale: 1 })
    },
    [prevButtonRef, prevButtonAnimation]
  )
  useKeyPress({
    keys: ['ArrowLeft', 'a'],
    onPress: onLeftPress,
    debounce: 100,
    sharedTimer: sharedTimerRef,
    avoidModifiers: true,
    capture: true
  })

  const onRightPress = useCallback(
    async (event: KeyboardEvent) => {
      event.preventDefault()
      if (!nextButtonRef.current) return

      nextButtonRef.current?.blur()
      nextButtonRef.current.ariaPressed = 'true'
      await nextButtonAnimation.start(buttonTapAnimation)
      nextButtonRef.current?.click()
      nextButtonRef.current?.focus()
      nextButtonRef.current?.blur()
      nextButtonRef.current.ariaPressed = 'false'
      await nextButtonAnimation.start({ scale: 1 })
    },
    [nextButtonRef, nextButtonAnimation]
  )
  useKeyPress({
    keys: ['ArrowRight', 'd'],
    onPress: onRightPress,
    debounce: 100,
    sharedTimer: sharedTimerRef,
    avoidModifiers: true,
    capture: true
  })

  const onEscapePress = useCallback(
    async (event: KeyboardEvent) => {
      event.preventDefault()
      if (!settingsButtonRef.current) return

      settingsButtonRef.current.ariaPressed = 'true'
      settingsButtonAnimation.start('whileTap')
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (!settingsButtonRef.current) return
      settingsButtonRef.current.ariaPressed = 'false'
      settingsButtonAnimation.start('initial')
      settingsButtonRef.current.click()
    },
    [settingsButtonRef, settingsButtonAnimation]
  )
  useKeyPress({
    key: 'Escape',
    onPress: onEscapePress
  })

  useEffect(() => {
    if (!config.background.is_outdated) return
    toast.error(
      'Your background is outdated. This may result in a black screen in game.',
      {
        // id: 'reset-background',
        action: {
          label: 'Revert to Default',
          onClick: () => resetBackground()
        },
        duration: 5000
      }
    )
  }, [config.background.is_outdated, resetBackground])

  const handleSelect = useCallback(
    (index: number) => {
      const ref = backgroundRefs.current[index]
      if (!ref || (activeBackground && ref.id === activeBackground?.id)) return
      const background = backgrounds.at(index)
      if (!background) return

      setActiveBackground(background)
      resetSetBackground()
    },
    [activeBackground, backgrounds, resetSetBackground, setActiveBackground]
  )

  useLayoutEffect(() => {
    if (!activeBackground) return
    const index = backgrounds.findIndex((bg) => bg.id === activeBackground.id)
    const ref = backgroundRefs.current[index]

    const handleResize = () => {
      if (!ref) return
      ref.scrollIntoView({
        behavior: 'smooth',
        inline: 'center'
      })
      console.log('resize')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [activeBackground, backgrounds])

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeBackground, backgrounds]
  )

  return (
    <motion.div
      className="relative flex h-full w-full flex-col p-6 pt-0"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <div className="relative">
        <div className="scrollbar-hide -mx-1 flex h-48 flex-shrink-0 items-center gap-3 overflow-x-auto scroll-smooth px-12 before:pointer-events-none before:absolute before:-left-1 before:z-10 before:h-full before:w-6 before:content-[''] before:bg-easing-l-menu-top after:pointer-events-none after:absolute after:-right-1 after:z-10 after:h-full after:w-6 after:content-[''] after:bg-easing-r-menu-top first:pl-12 last:pr-12">
          {backgrounds.map((background, index) => (
            <motion.button
              key={background.id}
              onClick={() => handleSelect(index)}
              aria-label={`${background.name} Background`}
              className={clsx(
                'aspect-video w-fit select-none shadow-lg ring-offset-transparent transition-[width,height,box-shadow,filter] focus:outline-none',
                activeBackground?.id === background.id
                  ? 'highlight h-36 rounded-xl shadow-orange-600/15'
                  : 'highlight-base h-28 rounded-lg shadow-orange-600/10 hover:shadow-orange-600/15'
              )}
              initial={{ transform: 'scale(.9)' }}
              animate={{ transform: 'scale(1)' }}
              whileHover={{
                transform:
                  activeBackground?.id === background.id
                    ? 'scale(1)'
                    : 'scale(1.05)',
                transition: { duration: 0.2 }
              }}
              whileTap={{
                transform: 'scale(1)',
                transition: { duration: 0.2 }
              }}
              transition={{ duration: 0.3 }}
              tabIndex={-1}
              ref={(el) => (backgroundRefs.current[index] = el!)}
            >
              <img
                id={background.id}
                alt={background.name}
                className={clsx(
                  'pointer-events-none h-full w-full select-none object-cover transition-[border-radius]',
                  activeBackground?.id === background.id
                    ? 'rounded-xl'
                    : 'rounded-lg'
                )}
                src={`/backgrounds/${background.image}`}
                onError={onImageError}
                aria-hidden
              />
              <div
                className={clsx(
                  'pointer-events-none absolute bottom-0 left-0 right-0 select-none truncate text-ellipsis bg-gradient-to-t from-zinc-950/50 to-transparent p-1 text-center font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] transition-[font-size,border-radius] duration-200 will-change-transform',
                  activeBackground?.id === background.id
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
          className="pointer-events-none absolute left-1 top-0 z-20 flex h-full items-center"
          initial={{ transform: 'translateX(15px)' }}
          animate={{ transform: 'translateX(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            ref={prevButtonRef}
            className="pointer-events-auto rounded-full bg-zinc-800/70 p-1 backdrop-blur transition-colors hover:bg-zinc-700/70 focus-visible:bg-zinc-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:bg-zinc-600/70 aria-pressed:bg-zinc-600/70"
            onClick={() => handleNavigate('prev')}
            animate={prevButtonAnimation}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileFocus={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            aria-label="Previous Background"
          >
            <ChevronLeft size={24} className="text-white" />
          </motion.button>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute right-1 top-0 z-20 flex h-full items-center"
          initial={{ transform: 'translateX(-15px)' }}
          animate={{ transform: 'translateX(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            ref={nextButtonRef}
            className="pointer-events-auto rounded-full bg-zinc-800/70 p-1 backdrop-blur transition-colors hover:bg-zinc-700/70 focus-visible:bg-zinc-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:bg-zinc-600/60 aria-pressed:bg-zinc-600/60"
            onClick={() => handleNavigate('next')}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileFocus={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            animate={nextButtonAnimation}
            aria-label="Next Background"
          >
            <ChevronRight size={24} className="text-white" />
          </motion.button>
        </motion.div>
      </div>
      <motion.div
        className="relative flex h-full min-h-0 w-full flex-1 select-none justify-center"
        initial={{ transform: 'scale(.95)' }}
        whileInView={{ transform: 'scale(1)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-4 p-4">
          {activeBackground && (
            <div
              className="scrollbar-hide flex h-fit w-fit flex-wrap gap-2 text-sm"
              key={activeBackground.id}
            >
              {activeBackground.tags.map((tag) => (
                <motion.p
                  key={tag}
                  className="flex-shrink-0 rounded-md border border-zinc-800/80 bg-zinc-700/80 px-2 py-1 font-medium text-zinc-100 backdrop-blur"
                  initial={{ opacity: 0, transform: 'translateY(-4px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transform: 'translateY(-4px)' }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeInOut',
                    transform: { duration: 0.25 }
                  }}
                  aria-label={`Selected background tagged as ${tag}`}
                >
                  {tag}
                </motion.p>
              ))}
            </div>
          )}
          {/* NOTE: hideme if required */}
          <div className="ml-auto w-fit">
            <MotionLink
              ref={settingsButtonRef}
              to="/settings"
              replace
              aria-label="Open Settings"
              role="button"
              className="block rounded-full border-2 border-zinc-800/80 bg-zinc-700/80 text-zinc-100 ring-zinc-100 backdrop-blur transition-colors hover:border-zinc-100 focus-visible:border-zinc-100 focus-visible:outline-none focus-visible:ring-1 active:border-zinc-100 active:bg-zinc-600/70 aria-pressed:border-zinc-100 aria-pressed:bg-zinc-600/70"
              variants={{
                initial: { scale: 1 },
                whileHover: { scale: 1.05 },
                whileFocus: { scale: 1.05 },
                whileTap: { scale: 0.95 }
              }}
              initial="initial"
              whileHover="whileHover"
              whileFocus="whileFocus"
              whileTap="whileTap"
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              draggable={false}
              animate={settingsButtonAnimation}
              {...linkFix}
            >
              <motion.div
                variants={{
                  initial: { rotate: 30 },
                  whileHover: { rotate: 390 },
                  whileFocus: { rotate: 390 },
                  whileTap: { rotate: 390 }
                }}
                transition={{ rotate: { duration: 0.75, ease: 'easeOut' } }}
              >
                <SettingsIcon
                  size={24}
                  className="box-content size-6 p-2"
                  aria-hidden
                />
              </motion.div>
            </MotionLink>
          </div>
        </div>
        {activeBackground && (
          <div className="absolute bottom-0 z-10 flex w-full items-center gap-5 rounded-b-lg bg-zinc-950/50 p-4 pt-0 before:absolute before:-top-8 before:left-0 before:h-8 before:w-full before:content-[''] before:bg-easing-b-menu-bottom">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeBackground.id}-description`}
                className="mr-auto flex flex-col"
                initial={{ opacity: 0, transform: 'translateY(8px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
              >
                <h1 className="text-2xl font-bold">{activeBackground.name}</h1>
                <p className="text-lg">{activeBackground.description}</p>
              </motion.div>
            </AnimatePresence>

            {(config.background.is_outdated ||
              config.background.current !== null) && (
              <button
                className={clsx(
                  'relative h-14 w-48 select-none text-center text-lg font-medium uppercase tracking-wider transition-[color,transform] will-change-transform hover:text-zinc-300 focus-visible:text-zinc-300 focus-visible:outline-none active:scale-95 disabled:pointer-events-none',
                  resetStatus === 'idle' &&
                    'underline-fade-in after:bottom-4 after:left-1.5 after:right-1.5 after:w-[calc(100%-0.75rem)] after:bg-zinc-300'
                )}
                onClick={() => resetBackground()}
                disabled={resetStatus !== 'idle'}
              >
                <AnimatePresence mode="wait">
                  {resetStatus === 'pending' || resetStatus === 'success' ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      key="pending"
                    >
                      <LoaderPinwheel className="mx-auto animate-spin" />
                    </motion.span>
                  ) : (
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      key="idle"
                    >
                      Revert to Default
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
            {/* <button className="group rounded-full border-2 border-orange-900/50 bg-orange-950 p-3.5 text-orange-100 shadow-md ring-white transition-[border-color,transform,fill] will-change-transform hover:scale-105 hover:border-white focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 active:scale-95 active:border-orange-200 active:ring-orange-200">
            <HeartIcon
              size={24}
              className="fill-transparent transition-colors group-hover:fill-current group-focus-visible:fill-current group-active:fill-orange-200 group-active:stroke-orange-200"
            />
          </button> */}
            <button
              className={clsx(
                'h-14 w-40 select-none rounded-[0.2rem] border-2 border-orange-800/40 bg-orange-500 px-10 text-center text-lg font-medium uppercase tracking-wider text-orange-50 shadow-md ring-white transition-[border-color,transform,border-radius,box-shadow] will-change-transform hover:scale-105 hover:rounded-[0.25rem] hover:border-orange-50 focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-1 active:scale-95 disabled:!scale-100 disabled:!border-orange-800/40',
                setStatus === 'pending' && 'cursor-wait'
              )}
              onClick={() => {
                if (setStatus === 'pending') return
                setBackground({ id: activeBackground.id })
              }}
              disabled={
                config.background.current === activeBackground.id ||
                setStatus === 'success'
              }
              key={activeBackground.id}
            >
              <AnimatePresence mode="wait" initial={false}>
                {config.background.current === activeBackground.id ||
                setStatus === 'success' ? (
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
                ) : setStatus === 'pending' ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    key="pending"
                  >
                    <LoaderPinwheel className="mx-auto animate-spin text-orange-200" />
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
        )}
        {activeBackground ? (
          <img
            alt={`${activeBackground.name} Background`}
            className="pointer-events-none z-0 h-full w-full select-none rounded-lg object-cover shadow-lg"
            src={`/backgrounds/${activeBackground.image}`}
            onError={onImageError}
            draggable={false}
          />
        ) : (
          <div className="">hello</div>
        )}
      </motion.div>
    </motion.div>
  )
}
