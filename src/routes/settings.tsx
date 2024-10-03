import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { relaunch } from '@tauri-apps/plugin-process'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircleIcon,
  CircleIcon,
  LoaderPinwheel,
  XIcon
} from 'lucide-react'
import { Suspense, useCallback, useEffect, useState } from 'react'
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
import Loading, { LoadingInline } from '@/components/Loading'
import { Progress } from '@/components/Progress'
import SteamProfileList from '@/components/SteamProfileList'
import Version from '@/components/Version'
import {
  fadeInFastVariants,
  fadeInVariants,
  moveInLessVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import {
  invalidateActiveBackground,
  settingsQueryOptions,
  useCheckUpdates,
  useResetMutation,
  useSetupMutation,
  useUpdateMutation
} from '@/lib/data'
import { ConfigError, ConfigErrors, SetupError } from '@/lib/errors'
import useKeyPress from '@/lib/useKeyPress'

export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(settingsQueryOptions)
  },
  component: Settings,
  pendingComponent: Loading
})

function Settings() {
  const router = useRouter()

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
      className="flex w-full select-none flex-col p-6"
      variants={fadeInFastVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="w-full" variants={staggerChildrenVariants}>
        <motion.div
          className="mb-4 flex justify-between"
          variants={moveInLessVariants}
        >
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="-mr-2.5">
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
          </div>
        </motion.div>

        <motion.div className="flex w-full flex-col gap-4">
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
                OverBuddy allows you to change your Overwatch™ main menu
                background. Made with{' '}
                <span className="saturate-[0.75]">❤️</span> by{' '}
                <span className="font-bold">Kirill Tregubov</span>. All code is{' '}
                <ExternalLinkInline href={import.meta.env.REPOSITORY_URL}>
                  open source
                </ExternalLinkInline>
                .
              </p>
              <p>
                This app is built on the shoulders of giants and wouldn&apos;t
                be possible without the work of{' '}
                <ExternalLinkInline href="https://steamcommunity.com/sharedfiles/filedetails/?id=3099694051">
                  SkyBorik
                </ExternalLinkInline>
                ,{' '}
                <ExternalLinkInline href="https://gist.github.com/Toyz/30e6fd504c713511f67f1a607025b0bc">
                  Toyz
                </ExternalLinkInline>{' '}
                or the{' '}
                <ExternalLinkInline href="https://github.com/overtools/OWLib">
                  OverTools Team
                </ExternalLinkInline>
                .
              </p>
              <p>
                Blizzard Entertainment, Battle.net and Overwatch are trademarks
                or registered trademarks of Blizzard Entertainment, Inc. in the
                U.S. and/or other countries.{' '}
                {/* Steam and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries. */}
                All rights reserved.
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
            <Suspense
              fallback={
                <div className="flex h-[8.25rem] w-full items-center justify-center rounded-lg bg-zinc-800 p-2 pr-6 shadow-inner shadow-zinc-900">
                  <LoadingInline />
                </div>
              }
            >
              <Platforms />
            </Suspense>
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
            <CheckForUpdates />
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

function Platforms() {
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

  return (
    <motion.div className="rounded-lg bg-zinc-800 p-2 pr-6 shadow-inner shadow-zinc-900">
      <motion.div
        className="flex w-full gap-6"
        variants={fadeInVariants}
        initial="hidden"
        animate="show"
      >
        <AlertDialog>
          <AlertDialogContent data-ignore-global-shortcut>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Battle.net?</AlertDialogTitle>
              <AlertDialogDescription>
                You will no longer be able to change the background shown when
                launching Overwatch through Battle.net.
                {data.platforms.filter((p) => p !== 'BattleNet').length ===
                  0 && (
                  <>
                    {' '}
                    Since Battle.net is the only connected platform, this action
                    will bring you back to the setup page.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const newPlatforms = data.platforms.includes('BattleNet')
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
                You will no longer be able to change the background shown when
                launching Overwatch through Steam.
                {data.platforms.filter((p) => p !== 'Steam').length === 0 && (
                  <>
                    {' '}
                    Since Steam is the only connected platform, this action will
                    bring you back to the setup page.
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
              className="group relative -m-3 flex flex-col items-center justify-center gap-2 p-3 outline-none transition-[background-color,transform] duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
              onClick={(event) => {
                toast.warning('Compatibility with Steam is not ready yet.', {
                  id: 'steam-support-warning'
                })
                event.preventDefault()
                return

                // if (data.platforms.includes('Steam')) {
                //   return
                // } else {
                //   event.preventDefault()
                // }

                // const newPlatforms = data.platforms.includes('Steam')
                //   ? data.platforms.filter((p) => p !== 'Steam')
                //   : data.platforms.concat('Steam')

                // mutate({
                //   platforms: newPlatforms,
                //   isInitialized: true
                // })
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
              <div className="absolute top-8 rotate-12 text-nowrap rounded-full bg-gradient-to-br from-pink-500 to-orange-500 px-2 py-1 text-xs font-medium text-white">
                Coming Soon
              </div>
            </AlertDialogTrigger>
            <AnimatePresence mode="wait">
              {data.platforms.includes('Steam') && data.steam_profiles && (
                <SteamProfileList
                  steam_profiles={data.steam_profiles}
                  isFetching={isFetching}
                />
              )}
            </AnimatePresence>
          </div>
        </AlertDialog>
      </motion.div>
    </motion.div>
  )
}

// Prevent F5, Ctrl+R (Windows/Linux), Command+R (Mac) from refreshing the page
function preventReload(event: KeyboardEvent) {
  if (
    event.key === 'F5' ||
    (event.ctrlKey && event.key === 'r')
    // || (event.metaKey && event.key === 'r') // macOS
  ) {
    event.preventDefault()
  }
}

function CheckForUpdates() {
  const [isOpen, setIsOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const {
    status: checkStatus,
    data: checkData,
    mutate: checkForUpdates
  } = useCheckUpdates({
    onSuccess: (data) => {
      if (!data) return
      setIsOpen(data.available)
      if (data.available === false) {
        toast.success('You are using the latest version of OverBuddy.')
      }
    }
  })
  const {
    data: updateSuccess,
    status: updateStatus,
    mutate: update
  } = useUpdateMutation()

  useEffect(() => {
    if (updateStatus === 'success' && updateSuccess) {
      document.addEventListener('keydown', preventReload)
    }

    return () => {
      document.removeEventListener('keydown', preventReload)
    }
  }, [updateStatus, updateSuccess])

  return (
    <>
      <AlertDialog open={isOpen && checkData?.available}>
        <AlertDialogContent data-ignore-global-shortcut>
          <AnimatePresence mode="wait" initial={false}>
            {updateStatus === 'idle' ? (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
                key="idle"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    OverBuddy v{checkData?.version} is available.
                  </AlertDialogTitle>
                  <pre className="whitespace-pre-wrap font-sans">
                    <AlertDialogDescription>
                      {checkData?.body ?? 'There is no changelog available.'}
                    </AlertDialogDescription>
                  </pre>
                </AlertDialogHeader>
              </motion.span>
            ) : updateStatus === 'success' ? (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
                key="success"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    OverBuddy v{checkData?.version} has been installed.
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Please restart OverBuddy to complete the update.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
                key="updating"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Updating to OverBuddy v{checkData?.version}...
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="py-1">
                      <Progress value={progress} />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </motion.span>
            )}
          </AnimatePresence>
          <AlertDialogFooter>
            <AnimatePresence mode="wait" initial={false}>
              {updateStatus === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="cancel"
                >
                  <AlertDialogCancel onClick={() => setIsOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                </motion.div>
              )}
              {updateStatus === 'idle' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="download"
                >
                  <AlertDialogAction onClick={() => update(setProgress)}>
                    Download and Install
                  </AlertDialogAction>
                </motion.div>
              ) : updateStatus === 'success' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="restart"
                >
                  <AlertDialogAction onClick={() => relaunch()}>
                    Restart OverBuddy
                  </AlertDialogAction>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="downloading"
                >
                  <AlertDialogAction
                    disabled
                    className="pointer-events-none disabled:!opacity-80"
                  >
                    Downloading...
                  </AlertDialogAction>
                </motion.div>
              )}
            </AnimatePresence>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex w-full items-center gap-4">
        <MotionButton
          className="w-fit min-w-[10.5rem] disabled:pointer-events-none disabled:!opacity-100"
          onClick={() => checkForUpdates()}
          disabled={checkStatus === 'pending'}
        >
          <AnimatePresence mode="wait">
            {checkStatus === 'pending' ? (
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
                Check for Updates
              </motion.span>
            )}
          </AnimatePresence>
        </MotionButton>
        <p className="text-zinc-400">
          <Version /> installed.
        </p>
      </div>
    </>
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
      <AnimatePresence mode="wait" initial={false}>
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
                      Confirm Reset Settings (This action cannot be undone)
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
