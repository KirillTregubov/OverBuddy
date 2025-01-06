import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { relaunch } from '@tauri-apps/plugin-process'
import clsx from 'clsx'
import {
  CheckCircleIcon,
  CircleIcon,
  LoaderPinwheel,
  XIcon
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
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
import type { State } from '@/components/ErrorComponent'
import KeyboardButton from '@/components/KeyboardButton'
import { LoadingInline } from '@/components/Loading'
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
  launchQueryOptions,
  updateQueryOptions,
  useCheckUpdates,
  useResetMutation,
  useSetupMutation,
  useUpdateMutation
} from '@/lib/data'
import { ConfigError, ConfigErrors, SetupError } from '@/lib/errors'
import type { Platform } from '@/lib/schemas'
import useKeyPress from '@/lib/useKeyPress'

type SettingsSearch = {
  update: boolean
}

export const Route = createFileRoute('/settings')({
  loaderDeps: ({ search: { update } }) => ({ update }),
  loader: async ({ context: { queryClient }, deps: { update } }) => {
    queryClient.ensureQueryData(launchQueryOptions)
    if (update) await queryClient.ensureQueryData(updateQueryOptions(true))
    else queryClient.removeQueries(updateQueryOptions(true))
  },
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    return {
      update: (search.update as boolean) || false
    }
  },
  component: Settings
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
      className="flex w-full flex-col p-6 pr-3"
      variants={fadeInFastVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="w-full" variants={staggerChildrenVariants}>
        <motion.div
          className="mb-4 flex justify-between"
          variants={moveInLessVariants}
        >
          <h1 className="select-none text-2xl font-bold">Settings</h1>
          <div className="-mr-2.5 select-none">
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
              <h2 className="select-none text-lg font-bold text-white">
                About
              </h2>
              <p className="select-none">About OverBuddy.</p>
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
                U.S. and/or other countries. Steam and the Steam logo are
                trademarks and/or registered trademarks of Valve Corporation in
                the U.S. and/or other countries. All rights reserved.
              </p>
            </div>
            <div className="mt-0.5">
              <CheckForUpdates />
            </div>
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="select-none text-lg font-bold text-white">
                Platforms
              </h2>
              <p className="select-none">
                Connect platform(s) you use to play Overwatch.
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
              <h2 className="select-none text-lg font-bold text-white">
                Keybinds
              </h2>
              <p className="select-none">Available keyboard controls.</p>
            </div>
            <div className="flex flex-col gap-1.5 text-zinc-400">
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline">
                  <KeyboardButton>Esc</KeyboardButton>
                </div>
                <p className="select-none">Toggle Settings</p>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <KeyboardButton>A</KeyboardButton>
                  <span className="select-none">or</span>
                  <KeyboardButton>←</KeyboardButton>
                </div>
                <p className="select-none">Select Previous Background</p>
              </div>
              <div className="flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <KeyboardButton>D</KeyboardButton>
                  <span className="select-none">or</span>
                  <KeyboardButton>→</KeyboardButton>
                </div>
                <p className="select-none">Select Next Background</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="flex flex-col gap-2"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="select-none text-lg font-bold text-white">
                Utilities
              </h2>
              <p className="select-none">Advanced tools.</p>
            </div>
            <ToggleConsole />
            {/* TODO: Set custom background id (full and truncated) */}
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="select-none text-lg font-bold text-white">
                Reset
              </h2>
              <p className="select-none">
                Restore all settings to their defaults.
              </p>
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
  const { data, isFetching } = useSuspenseQuery(launchQueryOptions)
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
      } else {
        throw error
      }
    },
    onSuccess: ({ config }) => {
      if (config.steam.enabled && !config.steam.setup) {
        router.navigate({
          to: '/setup/steam_setup',
          replace: true
        })
      }
    },
    throwOnError: false
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
                {!data.steam.enabled && (
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
                  const newPlatforms: Platform[] = []
                  if (data.steam.enabled) {
                    newPlatforms.push('Steam')
                  }

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
              if (data.battle_net.enabled) {
                return
              } else {
                event.preventDefault()
              }

              const newPlatforms: Platform[] = ['BattleNet']
              if (data.steam.enabled) {
                newPlatforms.push('Steam')
              }

              mutate({
                platforms: newPlatforms,
                isInitialized: true
              })
            }}
            title={`${data.battle_net.enabled ? 'Disconnect' : 'Connect'} Battle.net`}
          >
            <img
              src={BattleNet}
              alt="Battle.net Logo"
              title="Battle.net"
              width="64px"
              height="64px"
              className={clsx(
                'rounded-full ring-white grayscale transition will-change-transform group-focus-visible:ring',
                data.battle_net.enabled
                  ? 'grayscale-0 group-active:grayscale'
                  : 'group-active:grayscale-0'
              )}
            />
            <h2
              className={clsx(
                'flex min-w-[6rem] select-none items-center gap-1.5 text-center font-medium leading-none transition',
                data.battle_net.enabled
                  ? 'text-white group-active:text-zinc-400'
                  : 'text-zinc-400 group-active:text-white'
              )}
            >
              <AnimatePresence mode="wait">
                {data.battle_net.enabled ? (
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
                {!data.battle_net.enabled && (
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
                  const newPlatforms: Platform[] = []
                  if (data.battle_net.enabled) {
                    newPlatforms.push('BattleNet')
                  }

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
              data.steam.enabled ? 'before:opacity-100' : 'before:opacity-0'
            )}
            style={{
              transition: 'width 0s ease 0.15s'
            }}
          >
            <AlertDialogTrigger
              className="group relative -m-3 flex flex-col items-center justify-center gap-2 p-3 outline-none transition-[background-color,transform] duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
              onClick={(event) => {
                if (data.steam.enabled) {
                  return
                } else {
                  event.preventDefault()
                }

                const newPlatforms: Platform[] = ['Steam']
                if (data.battle_net.enabled) {
                  newPlatforms.push('BattleNet')
                }

                mutate({
                  platforms: newPlatforms,
                  isInitialized: true
                })
              }}
              title={`${data.steam.enabled ? 'Disconnect' : 'Connect'} Steam`}
            >
              <img
                src={Steam}
                alt="Steam Logo"
                title="Steam"
                width="64px"
                height="64px"
                className={clsx(
                  'rounded-full ring-white grayscale transition will-change-transform group-focus-visible:ring',
                  data.steam.enabled
                    ? 'grayscale-0 group-active:grayscale'
                    : 'group-active:grayscale-0'
                )}
              />
              <h2
                className={clsx(
                  'flex min-w-[4.5rem] select-none items-center gap-1.5 text-center font-medium leading-none transition',
                  data.steam.enabled
                    ? 'text-white group-active:text-zinc-400'
                    : 'text-zinc-400 group-active:text-white'
                )}
              >
                <AnimatePresence mode="wait">
                  {data.steam.enabled ? (
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
              {data.steam.enabled && data.steam.profiles && (
                <SteamProfileList
                  steam_profiles={data.steam.profiles}
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
  const { update } = Route.useSearch()
  const { data: checkData2 } = useQuery(updateQueryOptions(update))
  const [isOpen, setIsOpen] = useState(checkData2?.available ?? false)
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
    mutate: applyUpdate
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
      <AlertDialog
        open={isOpen && (checkData?.available || checkData2?.available)}
      >
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
                    OverBuddy v{checkData?.version || checkData2?.version} is
                    available.
                  </AlertDialogTitle>
                  <pre className="whitespace-pre-wrap font-sans">
                    <AlertDialogDescription>
                      {(checkData?.body || checkData2?.body) ??
                        'There is no changelog available.'}
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
                    OverBuddy v{checkData?.version || checkData2?.version} has
                    been installed.
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
                    Updating to OverBuddy v
                    {checkData?.version || checkData2?.version}...
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
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              {updateStatus === 'idle' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="download"
                >
                  <AlertDialogAction onClick={() => applyUpdate(setProgress)}>
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
          className="group grid w-fit min-w-[10.5rem] disabled:pointer-events-none disabled:!opacity-100"
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

  const handleClick = () => {
    if (isConfirming === 'idle') {
      setIsConfirming('confirm')
      return
    } else if (isConfirming === 'confirm') {
      setIsConfirming('pending')
      mutate()
      return
    }
  }

  return (
    <div className="flex gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {isConfirming === 'idle' && (
          <MotionButton
            key="idle"
            className="w-fit min-w-[8.375rem]"
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
              className="w-fit min-w-[8.375rem]"
              onClick={() => setIsConfirming('idle')}
              disabled={isConfirming !== 'confirm'}
            >
              Cancel
            </MotionButton>
            <AnimatePresence mode="wait">
              <MotionButton
                key={isConfirming}
                disabled={isConfirming === 'pending'}
                destructive={isConfirming === 'confirm'}
                onClick={handleClick}
                className={clsx(
                  'w-fit min-w-[28rem]',
                  isConfirming === 'pending' && 'pointer-events-none'
                )}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15, ease: 'easeOut' } }}
              >
                <AnimatePresence mode="wait">
                  {isConfirming === 'confirm' ? (
                    <span>
                      Confirm Reset Settings (This action cannot be undone)
                    </span>
                  ) : (
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

// TODO: Implement
function ToggleConsole() {
  // const { data: consoleVisible } = useQuery(consoleQueryOptions)
  const checkStatus = 'idle'
  const status = false

  return (
    <div className="flex w-full items-baseline gap-4">
      <MotionButton
        className="w-fit min-w-[10.5rem] disabled:pointer-events-none disabled:!opacity-100"
        onClick={() => console.log('Toggle Console')}
        // disabled={checkStatus === 'pending'}
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
              {status ? 'Disable' : 'Enable'} Debug Console
            </motion.span>
          )}
        </AnimatePresence>
      </MotionButton>
      <div className="flex select-none flex-wrap items-baseline gap-2 text-zinc-400">
        <p>Allows you to access the Overwatch debug console.</p>
        <div className="flex items-baseline gap-1">
          <KeyboardButton>Alt</KeyboardButton>
          <span className="select-none">+</span>
          <KeyboardButton>~</KeyboardButton>
        </div>
        <p>In-Game</p>
      </div>
    </div>
  )
}
