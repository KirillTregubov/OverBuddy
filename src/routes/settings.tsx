import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircleIcon,
  CircleIcon,
  LoaderPinwheel,
  XIcon
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import BattleNet from '@/assets/BattleNet.svg'
import Steam from '@/assets/Steam.svg'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/AlertDialog'
import { ExternalLinkInline, MotionButton } from '@/components/Button'
import KeyboardButton from '@/components/KeyboardButton'
import Loading from '@/components/Loading'
import SteamProfileComponent from '@/components/SteamProfile'
import {
  fadeInFastVariants,
  moveInLessVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import {
  invalidateActiveBackground,
  settingsQueryOptions,
  useResetMutation,
  useSetupMutation,
  useUpdateMutation
} from '@/lib/data'
import { ConfigError, ConfigErrors, SetupError } from '@/lib/errors'
import type { SteamProfile } from '@/lib/schemas'
import { useIsOverflow } from '@/lib/useIsOverflow'
import useKeyPress from '@/lib/useKeyPress'

function SteamProfileList({
  steam_profiles,
  isFetching
}: {
  steam_profiles: SteamProfile[]
  isFetching: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isOverflow = useIsOverflow(ref)

  return (
    <motion.div
      ref={ref}
      key="steam_profiles"
      className={clsx(
        'scroller scroller-settings z-10 -mb-2 -mr-3 flex cursor-auto gap-6 overflow-x-scroll py-2 last:pr-3',
        isOverflow ? '' : 'scroller-hidden'
      )}
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.15, ease: 'easeInOut' }}
    >
      {steam_profiles.length > 0 ? (
        <>
          {steam_profiles.map((profile) => (
            <SteamProfileComponent key={profile.id} account={profile} />
          ))}
          <motion.div
            className="pointer-events-none absolute bottom-6 right-0 top-6 z-20 block w-4 bg-easing-r-settings"
            aria-hidden
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
            }}
          />
        </>
      ) : (
        <>No Steam Profiles</>
      )}
      <AnimatePresence mode="wait">
        {isFetching && (
          <motion.div
            key="fetching"
            aria-live="polite"
            className="right absolute -right-1 top-1 z-30 flex animate-pulse items-center gap-1 text-sm text-zinc-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.15, ease: 'easeInOut' }
            }}
          >
            <LoaderPinwheel size="1em" className="animate-spin" />
            Updating...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(settingsQueryOptions),
  component: Settings,
  pendingComponent: Loading
})

function Settings() {
  const router = useRouter()
  const { data, isFetching } = useSuspenseQuery(settingsQueryOptions)
  const { mutate } = useSetupMutation({
    onError: async (error) => {
      if (error instanceof SetupError) {
        toast.warning(
          'All platforms were disconnected. You have been returned to the setup page.',
          {
            duration: 5000
          }
        )
        invalidateActiveBackground()
        router.navigate({
          to: '/setup',
          replace: true
        })
        return
      } else if (
        error instanceof ConfigError &&
        ConfigErrors.safeParse(error.error_key).success
      ) {
        router.navigate({
          to: '/setup/$key',
          params: {
            key: error.error_key
          },
          search: {
            message: error.message,
            platforms: error.platforms
          },
          replace: true
        })
        return
      }
    },
    onSuccess: (data) => {
      if (data.config.steam.enabled && !data.config.steam.setup) {
        router.navigate({
          to: '/setup/steam_setup',
          replace: true
        })
        return
      }
    }
  })
  const { mutate: checkForUpdates } = useUpdateMutation()

  const onEscapePress = useCallback(
    async (event: KeyboardEvent) => {
      event.preventDefault()
      await new Promise((resolve) => setTimeout(resolve, 100))
      router.navigate({
        to: '/menu',
        replace: true
      })
    },
    [router]
  )
  const { pressed } = useKeyPress({
    key: 'Escape',
    onPress: onEscapePress
  })

  return (
    <motion.div
      className="flex w-full select-none flex-col px-6 py-4"
      variants={fadeInFastVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="w-full" variants={staggerChildrenVariants}>
        <motion.div variants={moveInLessVariants} className="-ml-2.5">
          <button
            onClick={() => router.navigate({ to: '/menu', replace: true })}
            className="group flex items-center gap-0.5 rounded-full px-1.5 font-medium text-zinc-400 transition-[box-shadow,color,background-color,border-color,transform] duration-100 will-change-transform hover:text-zinc-50 focus-visible:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <XIcon size={20} />
            <span className="mb-px">Close</span>
            <KeyboardButton isPressed={pressed} className="ml-1.5 mr-1">
              Esc
            </KeyboardButton>
          </button>
        </motion.div>
        <motion.div className="mb-5 mt-3" variants={moveInLessVariants}>
          <h1 className="text-2xl font-bold">Settings</h1>
        </motion.div>

        <motion.div className="flex w-full flex-col gap-5">
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">About</h2>
              <p className="">About OverBuddy.</p>
            </div>
            <div className="flex flex-col gap-1.5 text-zinc-400">
              <p>
                OverBuddy allows you to change your Overwatch main menu
                background. Made with <span className="saturate-50">❤️</span> by{' '}
                <span className="font-bold">Kirill Tregubov</span>. All code is{' '}
                <ExternalLinkInline href={import.meta.env.REPOSITORY_URL}>
                  open source
                </ExternalLinkInline>
                .
              </p>
              <p>
                As with all software, OverBuddy is built on the shoulders of
                giants. This app wouldn&apos;t be possible without the work of{' '}
                <ExternalLinkInline href="https://steamcommunity.com/sharedfiles/filedetails/?id=3099694051">
                  SkyBorik
                </ExternalLinkInline>{' '}
                or{' '}
                <ExternalLinkInline href="https://gist.github.com/Toyz/30e6fd504c713511f67f1a607025b0bc">
                  Toyz
                </ExternalLinkInline>
                .
              </p>
            </div>
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">Platforms</h2>
              <p className="">
                Connected platform(s) you use to play Overwatch.
              </p>
            </div>
            <motion.div className="flex gap-6 rounded-lg bg-zinc-800 p-2 pr-6 shadow-inner shadow-zinc-900">
              <AlertDialog>
                <AlertDialogContent data-ignore-global-shortcut>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Battle.net?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will no longer be able to change the background shown
                      when launching Overwatch through Battle.net.
                      {data.platforms.filter((p) => p !== 'BattleNet')
                        .length === 0 && (
                        <>
                          {' '}
                          Since Battle.net is the only connected platform, this
                          action will bring you back to the setup page.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const newPlatforms = data.platforms.includes(
                          'BattleNet'
                        )
                          ? data.platforms.filter((p) => p !== 'BattleNet')
                          : data.platforms.concat('BattleNet')

                        mutate({
                          platforms: newPlatforms,
                          isInitialized: true
                        })
                      }}
                    >
                      Disconnect Battle.net
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                <AlertDialogTrigger
                  className="group flex flex-col items-center gap-2 p-3 outline-none transition-transform duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
                  onClick={(event) => {
                    if (data.platforms.includes('BattleNet')) {
                      return
                    } else {
                      event.preventDefault()
                    }

                    const newPlatforms = data.platforms.includes('BattleNet')
                      ? data.platforms.filter((p) => p !== 'BattleNet')
                      : data.platforms.concat('BattleNet')

                    mutate({
                      platforms: newPlatforms,
                      isInitialized: true
                    })
                  }}
                  title={`${data.platforms.includes('BattleNet') ? 'Disconnect' : 'Connect'} Battle.net`}
                >
                  <img
                    src={BattleNet}
                    alt="Battle.net Logo"
                    title="Battle.net"
                    width="64px"
                    height="64px"
                    className={clsx(
                      'rounded-full ring-white grayscale transition will-change-transform group-focus-visible:ring',
                      data.platforms.includes('BattleNet')
                        ? 'grayscale-0 group-active:grayscale'
                        : 'group-active:grayscale-0'
                    )}
                  />
                  <h2
                    className={clsx(
                      'flex min-w-[6rem] items-center gap-1.5 text-center font-medium leading-none transition',
                      data.platforms.includes('BattleNet')
                        ? 'text-white group-active:text-zinc-400'
                        : 'text-zinc-400 group-active:text-white'
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {data.platforms.includes('BattleNet') ? (
                        <motion.span
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 1 }}
                          key="checked"
                        >
                          <CheckCircleIcon size={20} />
                        </motion.span>
                      ) : (
                        <motion.span
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 1 }}
                          key="unchecked"
                        >
                          <CircleIcon size={20} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    Battle.net
                  </h2>
                </AlertDialogTrigger>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogContent data-ignore-global-shortcut>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Steam?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will no longer be able to change the background shown
                      when launching Overwatch through Steam.
                      {data.platforms.filter((p) => p !== 'Steam').length ===
                        0 && (
                        <>
                          {' '}
                          Since Steam is the only connected platform, this
                          action will bring you back to the setup page.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const newPlatforms = data.platforms.includes('Steam')
                          ? data.platforms.filter((p) => p !== 'Steam')
                          : data.platforms.concat('Steam')

                        mutate({
                          platforms: newPlatforms,
                          isInitialized: true
                        })
                      }}
                    >
                      Disconnect Steam
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                <div
                  className={clsx(
                    "relative z-10 flex min-w-0 items-center justify-center gap-6 p-3 transition-[background-color,box-shadow] before:pointer-events-none before:absolute before:-left-3 before:-right-3 before:top-0 before:h-full before:rounded-md before:bg-zinc-700 before:shadow-inner before:shadow-zinc-800 before:transition-opacity before:delay-100 before:content-['']",
                    data.platforms.includes('Steam')
                      ? 'before:opacity-100'
                      : 'before:opacity-0'
                  )}
                  style={{
                    transition: 'width 0s ease 0.15s'
                  }}
                >
                  <AlertDialogTrigger
                    className="group -m-3 flex flex-col items-center justify-center gap-2 p-3 outline-none transition-[background-color,transform] duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
                    onClick={(event) => {
                      if (data.platforms.includes('Steam')) {
                        return
                      } else {
                        event.preventDefault()
                      }

                      const newPlatforms = data.platforms.includes('Steam')
                        ? data.platforms.filter((p) => p !== 'Steam')
                        : data.platforms.concat('Steam')

                      mutate({
                        platforms: newPlatforms,
                        isInitialized: true
                      })
                    }}
                    title={`${data.platforms.includes('Steam') ? 'Disconnect' : 'Connect'} Steam`}
                  >
                    <img
                      src={Steam}
                      alt="Steam Logo"
                      title="Steam"
                      width="64px"
                      height="64px"
                      className={clsx(
                        'rounded-full ring-white grayscale transition will-change-transform group-focus-visible:ring',
                        data.platforms.includes('Steam')
                          ? 'grayscale-0 group-active:grayscale'
                          : 'group-active:grayscale-0'
                      )}
                    />
                    <h2
                      className={clsx(
                        'flex min-w-[4.5rem] items-center gap-1.5 text-center font-medium leading-none transition',
                        data.platforms.includes('Steam')
                          ? 'text-white group-active:text-zinc-400'
                          : 'text-zinc-400 group-active:text-white'
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {data.platforms.includes('Steam') ? (
                          <motion.span
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            key="checked"
                          >
                            <CheckCircleIcon size={20} />
                          </motion.span>
                        ) : (
                          <motion.span
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            key="unchecked"
                          >
                            <CircleIcon size={20} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      Steam
                    </h2>
                  </AlertDialogTrigger>
                  <AnimatePresence mode="wait">
                    {data.platforms.includes('Steam') &&
                      data.steam_profiles && (
                        <SteamProfileList
                          steam_profiles={data.steam_profiles}
                          isFetching={isFetching}
                        />
                      )}
                  </AnimatePresence>
                </div>
              </AlertDialog>
            </motion.div>
            {/* <div className="h-64 w-full rounded-lg bg-zinc-700"></div> */}
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">Keybinds</h2>
              <p className="">Available keyboard controls.</p>
            </div>
            <div className="flex flex-col gap-1.5 text-zinc-400">
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <KeyboardButton>Esc</KeyboardButton>
                </div>
                <p>Open/Close Settings</p>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <KeyboardButton>A</KeyboardButton>
                  or
                  <KeyboardButton>←</KeyboardButton>
                </div>
                <p>Select Previous Background</p>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <KeyboardButton>D</KeyboardButton>
                  or
                  <KeyboardButton>→</KeyboardButton>
                </div>
                <p>Select Next Background</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">Update</h2>
              <p className="">Check for updates.</p>
            </div>
            <MotionButton
              className="w-fit min-w-36"
              onClick={() => checkForUpdates()}
            >
              Check for Updates
            </MotionButton>
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">Reset</h2>
              <p className="">Reset all settings to their defaults.</p>
            </div>
            <ResetButton />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

type State = 'idle' | 'confirm' | 'pending' | 'success'

function ResetButton() {
  const router = useRouter()
  const { mutate, reset: resetMutation } = useResetMutation({
    onSuccess: () => {
      router.navigate({
        to: '/setup',
        replace: true
      })
    },
    onError: () => {
      resetMutation()
      setIsConfirming('idle')
    },
    onSettled: () => {
      resetMutation()
    }
  })
  const [isConfirming, setIsConfirming] = useState<State>('idle')

  const handleClick = useCallback(() => {
    if (isConfirming === 'idle') {
      setIsConfirming('confirm')
      return
    } else if (isConfirming === 'confirm') {
      setIsConfirming('pending')
      mutate()
      return
    }
  }, [isConfirming, mutate])

  return (
    <div className="flex gap-2">
      <AnimatePresence mode="wait">
        {isConfirming === 'idle' && (
          <MotionButton
            key="idle"
            className="w-fit min-w-36"
            onClick={handleClick}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.15, ease: 'easeInOut' } }}
          >
            <span>Reset Settings</span>
          </MotionButton>
        )}
        {isConfirming !== 'idle' && (
          <motion.div
            key="prompt"
            className="flex gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.15, ease: 'easeInOut' } }}
          >
            <MotionButton
              key="idle"
              className="w-fit min-w-36"
              onClick={() => setIsConfirming('idle')}
              disabled={isConfirming !== 'confirm'}
            >
              Cancel
            </MotionButton>
            <AnimatePresence mode="wait">
              <MotionButton
                key={isConfirming}
                className={clsx(
                  'w-fit min-w-[28rem]',
                  isConfirming === 'pending' && 'pointer-events-none'
                )}
                destructive={isConfirming === 'confirm'}
                onClick={handleClick}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15, ease: 'easeOut' } }}
              >
                <AnimatePresence mode="wait">
                  {isConfirming === 'confirm' && (
                    <span>
                      Confirm Reset Settings (This action cannot be undone.)
                    </span>
                  )}
                  {isConfirming === 'pending' && (
                    <LoaderPinwheel className="mx-auto animate-spin" />
                  )}
                </AnimatePresence>
              </MotionButton>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
