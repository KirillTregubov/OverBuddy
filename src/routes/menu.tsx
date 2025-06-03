import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import {
  ChevronLeft,
  ChevronRight,
  LoaderPinwheel,
  SettingsIcon
} from 'lucide-react'
import { AnimatePresence, motion, useAnimation } from 'motion/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { toast } from 'sonner'

import placeholder from '@/assets/placeholder.svg'
import { MotionLink } from '@/components/Button'
import { fadeInVariants } from '@/lib/animations'
import {
  activeBackgroundQueryOptions,
  backgroundsQueryOptions,
  launchQueryOptions,
  shouldAdvertiseQueryOptions,
  updateQueryOptions,
  useActiveBackgroundMutation,
  useBackgroundMutation,
  useDismissAdMutation,
  useResetBackgroundMutation
} from '@/lib/data'
import { linkFix } from '@/lib/linkFix'
import useKeyPress from '@/lib/useKeyPress'
import { cn } from '@/lib/utils'

const buttonTapAnimation = {
  scale: 0.9
}

export const Route = createFileRoute('/menu')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const config = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch(() => {
        throw redirect({ to: '/' })
      })

    if (!config.is_setup) {
      throw redirect({ to: '/setup' })
    }

    if (config.steam.enabled && config.steam.in_setup) {
      throw redirect({ to: '/setup/steam_setup' })
    }
  },
  loader: async ({ context: { queryClient } }) => {
    return Promise.allSettled([
      queryClient.ensureQueryData(shouldAdvertiseQueryOptions),
      queryClient.ensureQueryData(updateQueryOptions(true)),
      queryClient.ensureQueryData(activeBackgroundQueryOptions),
      queryClient.ensureQueryData(backgroundsQueryOptions)
    ])
  },
  component: Menu,
  pendingMs: 0
})

function onImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  if (!event?.target) return
  ;(event.target as HTMLImageElement).src = placeholder
}

const handleKeyDown = (
  event: React.KeyboardEvent<HTMLButtonElement>,
  keys: string[]
) => {
  if (
    keys.includes(event.key) &&
    !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
  ) {
    ;(event.target as HTMLButtonElement).blur()
  }
}

const prevKeys = ['ArrowLeft', 'a']
const nextKeys = ['ArrowRight', 'd']

function Menu() {
  const navigate = useNavigate()
  const { data: backgrounds } = useSuspenseQuery(backgroundsQueryOptions)
  const { data: activeBackground } = useSuspenseQuery(
    activeBackgroundQueryOptions
  )
  const { data: config } = useSuspenseQuery(launchQueryOptions)
  const { data: shouldAdvertise } = useSuspenseQuery(
    shouldAdvertiseQueryOptions
  )
  const { data: updateAvailable } = useQuery(updateQueryOptions(true))
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
  const { mutate: setActiveBackground } = useActiveBackgroundMutation()
  const { mutate: dismissAd } = useDismissAdMutation()

  const [backgroundIndex, setBackgroundIndex] = useState(0)

  useEffect(() => {
    setBackgroundIndex(
      backgrounds.findIndex((bg) => bg.id === activeBackground.id) || 0
    )
  }, [backgrounds, activeBackground.id])

  // const [newBackground] = useState(
  //   backgrounds.findIndex((bg) => bg.new) || null
  // )
  // const [showNewButton, setShowNewButton] = useState(false)
  // useEffect(() => {
  //   if (!newBackground) return

  //   const newBackgroundRef = backgroundRefs.current[newBackground]
  //   if (!newBackgroundRef) return

  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (entry?.isIntersecting) setShowNewButton(false)
  //       else setShowNewButton(true)
  //     },
  //     {
  //       threshold: 0.3
  //     }
  //   )

  //   observer.observe(newBackgroundRef)

  //   return () => {
  //     if (newBackgroundRef) {
  //       observer.unobserve(newBackgroundRef)
  //     }
  //   }
  // }, [newBackground])

  const prevButtonRef = useRef<HTMLButtonElement>(null)
  const prevButtonAnimation = useAnimation()
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonAnimation = useAnimation()
  const settingsButtonRef = useRef<HTMLAnchorElement>(null)
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
    keys: prevKeys,
    onPress: onLeftPress,
    debounce: 50,
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
    keys: nextKeys,
    onPress: onRightPress,
    debounce: 50,
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

  // Update toast
  useEffect(() => {
    if (updateAvailable?.available) {
      toast.warning('There is a new version of OverBuddy available.', {
        id: 'update-available',
        action: {
          label: 'View Update',
          onClick: () => {
            navigate({
              to: '/settings',
              search: {
                update: true
              }
            })
          }
        },
        duration: Infinity
      })
    }

    return () => {
      toast.dismiss('update-available')
    }
  }, [updateAvailable, navigate])
  // Outdated background toast
  useEffect(() => {
    if (config.shared.background.is_outdated) {
      toast.warning(
        'Your background is outdated. This may result in a black screen in game.',
        {
          id: 'outdated-background',
          action: {
            label: 'Revert to Default',
            onClick: () => resetBackground()
          },
          duration: Infinity
        }
      )
    }

    return () => {
      toast.dismiss('outdated-background')
    }
  }, [config.shared.background.is_outdated, resetBackground])
  // Advertise Steam feature
  useEffect(() => {
    if (shouldAdvertise && config.steam.advertised < 4) {
      toast.info('OverBuddy now supports Steam. Enable it in the settings.', {
        id: 'advertise-steam',
        action: {
          label: 'Open Settings',
          onClick: () =>
            navigate({
              to: '/settings',
              replace: true
            })
        },
        onDismiss: () => dismissAd(),
        duration: 10000
      })
    }

    return () => {
      toast.dismiss('advertise-steam')
    }
  }, [shouldAdvertise, config.steam.advertised, navigate, dismissAd])

  useLayoutEffect(() => {
    const index = backgrounds.findIndex((bg) => bg.id === activeBackground.id)
    const ref = backgroundRefs.current[index]

    if (!ref) return

    const handleResize = () => {
      if (!ref) return

      requestAnimationFrame(() => {
        ref.scrollIntoView({
          behavior: 'smooth',
          // block: 'nearest', // Ensures minimal scroll movement
          inline: 'center'
        })
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [activeBackground, backgrounds])

  const handleSelect = (index: number) => {
    // if (newBackground && index === newBackground) {
    //   setShowNewButton(false)
    // }

    const ref = backgroundRefs.current[index]
    if (!ref || ref.id === activeBackground.id) return
    const background = backgrounds.at(index)
    if (!background) return

    setActiveBackground(background)
    resetSetBackground()
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = backgrounds.findIndex(
      (bg) => bg.id === activeBackground.id
    )
    let newIndex

    if (direction === 'prev') {
      prevButtonRef.current?.focus()
      newIndex =
        currentIndex - 1 < 0 ? backgrounds.length - 1 : currentIndex - 1
    } else {
      nextButtonRef.current?.focus()
      newIndex = currentIndex + 1 >= backgrounds.length ? 0 : currentIndex + 1
    }

    handleSelect(newIndex)
  }

  return (
    <motion.div
      className="relative flex h-full w-full flex-col p-6 pt-0"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <div className="relative">
        <div
          tabIndex={-1}
          className="scrollbar-hide -mx-3 flex h-48 flex-shrink-0 items-center gap-3 overflow-x-auto scroll-smooth px-14 outline-none before:pointer-events-none before:absolute before:-left-3 before:z-10 before:h-full before:w-6 before:content-[''] before:bg-easing-l-menu-top after:pointer-events-none after:absolute after:-right-3 after:z-10 after:h-full after:w-6 after:content-[''] after:bg-easing-r-menu-top"
        >
          {backgrounds.map((background, index) => (
            <motion.button
              key={background.id}
              onClick={() => handleSelect(index)}
              aria-label={`${background.name} Background`}
              className={clsx(
                'aspect-video w-fit select-none shadow-lg ring-offset-transparent transition-[width,height,box-shadow,filter] duration-200 focus:outline-none',
                activeBackground.id === background.id
                  ? 'highlight h-36 rounded-xl shadow-orange-600/15'
                  : 'highlight-base h-28 rounded-lg shadow-orange-600/10 hover:shadow-orange-600/15'
              )}
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              whileHover={{
                scale: activeBackground.id === background.id ? 1 : 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{
                scale: 1,
                transition: { duration: 0.2 }
              }}
              transition={{ duration: 0.3 }}
              tabIndex={-1}
              data-index={index}
              ref={(el) => {
                backgroundRefs.current[index] = el!
              }}
            >
              <img
                id={background.id}
                alt={background.name}
                className={clsx(
                  'pointer-events-none h-full w-full transform-gpu select-none object-cover transition-[border-radius]',
                  activeBackground.id === background.id
                    ? 'rounded-xl'
                    : 'rounded-lg'
                )}
                src={`/backgrounds/${background.image}`}
                onError={onImageError}
                aria-hidden
              />
              <div
                className={clsx(
                  'pointer-events-none absolute bottom-0 left-0 right-0 select-none truncate text-ellipsis bg-gradient-to-t from-zinc-950/50 to-transparent p-1 pb-2 pt-1.5 text-center text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] transition-[border-radius] duration-200',
                  activeBackground.id === background.id
                    ? 'rounded-b-xl'
                    : 'rounded-b-lg'
                )}
              >
                <div
                  className={clsx(
                    'font-bold transition-[font-size] duration-200 will-change-transform',
                    activeBackground.id === background.id
                      ? 'text-sm/4'
                      : 'text-xs'
                  )}
                >
                  {background.name}
                </div>
              </div>
              {background.new && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-[0.1875rem] border border-amber-200/60 bg-amber-300 px-1 text-xs font-bold uppercase tracking-wide text-yellow-950 shadow shadow-amber-700 will-change-transform">
                  NEW!
                </div>
              )}
            </motion.button>
          ))}
        </div>
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-20 flex h-full items-center"
          initial={{ transform: 'translateX(8px)' }}
          animate={{ transform: 'translateX(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex">
            <motion.button
              ref={prevButtonRef}
              className={cn(
                'peer pointer-events-auto relative rounded-full bg-zinc-800/70 p-1 text-zinc-100 backdrop-blur transition-colors hover:bg-zinc-700/70 focus-visible:bg-zinc-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:bg-zinc-600/70 aria-pressed:bg-zinc-600/70',
                backgroundIndex === 0 &&
                  'before:absolute before:inset-0 before:animate-ping before:rounded-full before:border before:border-white before:opacity-50'
              )}
              onClick={() => handleNavigate('prev')}
              animate={prevButtonAnimation}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileFocus={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              aria-label="Previous Background"
              onKeyDown={(event) => handleKeyDown(event, nextKeys)}
            >
              <ChevronLeft size={24} />
            </motion.button>

            <div
              className={cn(
                'absolute -left-4 -top-6 select-none whitespace-nowrap rounded-md bg-zinc-800/70 px-2 py-1 text-xs font-medium text-zinc-100 opacity-0 shadow-lg backdrop-blur transition duration-300',
                backgroundIndex === 0 &&
                  'peer-hover:-translate-y-2 peer-hover:opacity-100 peer-focus:-translate-y-2 peer-focus:opacity-100'
              )}
              aria-hidden={backgroundIndex !== 0}
              role="tooltip"
            >
              New Backgrounds
            </div>
          </div>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute right-0 top-0 z-20 flex h-full items-center"
          initial={{ transform: 'translateX(-8px)' }}
          animate={{ transform: 'translateX(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            ref={nextButtonRef}
            className="pointer-events-auto rounded-full bg-zinc-800/70 p-1 text-zinc-100 backdrop-blur transition-colors hover:bg-zinc-700/70 focus-visible:bg-zinc-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:bg-zinc-600/60 aria-pressed:bg-zinc-600/60"
            onClick={() => handleNavigate('next')}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileFocus={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            animate={nextButtonAnimation}
            aria-label="Next Background"
            onKeyDown={(event) => handleKeyDown(event, prevKeys)}
          >
            <ChevronRight size={24} />
          </motion.button>
        </motion.div>
        {/* <AnimatePresence>
          {showNewButton && (
            <motion.div
              className="pointer-events-none absolute right-0 top-6 z-20 flex h-full items-start justify-end"
              initial={{ transform: 'translateY(8px)', opacity: 0 }}
              animate={{ transform: 'translateY(0px)', opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                className="pointer-events-auto select-none rounded-full bg-zinc-100/80 px-3 py-1 text-black backdrop-blur transition-colors will-change-transform hover:bg-white/80 focus-visible:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:bg-white/90"
                onClick={() => handleSelect(newBackground!)}
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileFocus={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                aria-label="Previous Background"
              >
                See New
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence> */}
      </div>
      <motion.div
        className="relative flex h-full min-h-0 w-full flex-1 justify-center"
        initial={{ transform: 'scale(.95)' }}
        whileInView={{ transform: 'scale(1)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-4 p-4">
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

        <div className="absolute bottom-0 z-10 flex w-full items-center gap-5 rounded-b-lg bg-zinc-950/50 p-4 pt-0 before:absolute before:-top-7 before:left-0 before:h-7 before:w-full before:content-[''] before:bg-easing-b-menu-bottom">
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

          {(config.shared.background.is_outdated ||
            config.shared.background.current !== null) && (
            <button
              className={clsx(
                'relative h-14 w-48 select-none text-center text-lg font-medium uppercase tracking-wider transition will-change-transform hover:text-zinc-300 focus-visible:text-zinc-300 focus-visible:outline-none active:scale-95 disabled:pointer-events-none',
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

          {/* <button className="group rounded-full border-2 border-orange-900/50 bg-orange-950 p-3.5 text-orange-100 shadow-md ring-white transition will-change-transform hover:scale-105 hover:border-white focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 active:scale-95 active:border-orange-200 active:ring-orange-200">
              <HeartIcon
                size={24}
                className="fill-transparent transition-colors group-hover:fill-current group-focus-visible:fill-current group-active:fill-orange-200 group-active:stroke-orange-200"
              />
            </button> */}
          <button
            className={clsx(
              'h-14 w-40 select-none rounded-[0.2rem] border-2 border-orange-800/40 bg-orange-500 px-10 text-center text-lg font-medium uppercase tracking-wider text-orange-50 shadow-md ring-white transition will-change-transform hover:scale-105 hover:rounded hover:border-orange-50 focus-visible:scale-105 focus-visible:border-white focus-visible:outline-none focus-visible:ring-1 active:scale-95 disabled:!scale-100 disabled:!border-orange-800/40',
              setStatus === 'pending' && 'cursor-wait'
            )}
            onClick={() => {
              if (setStatus === 'pending') return
              setBackground({ id: activeBackground.id })
            }}
            disabled={
              config.shared.background.current === activeBackground.id ||
              setStatus === 'success'
            }
            key={activeBackground.id}
          >
            <AnimatePresence mode="wait" initial={false}>
              {config.shared.background.current === activeBackground.id ||
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
        <div className="pointer-events-none h-full w-full select-none">
          <img
            alt={`${activeBackground.name} Background`}
            className="pointer-events-none h-full w-full select-none rounded-lg object-cover shadow-lg"
            src={`/backgrounds/${activeBackground.image}`}
            onError={onImageError}
            draggable={false}
          />
          {/* <div className="flex h-full w-full select-none items-center justify-center rounded-lg bg-zinc-800/80 font-medium text-zinc-400 shadow-lg">
              No Background Selected
            </div> */}
        </div>
      </motion.div>
    </motion.div>
  )
}
