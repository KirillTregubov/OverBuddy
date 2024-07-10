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

import BattleNet from '@/assets/BattleNet.svg'
import Steam from '@/assets/Steam.svg'
import { ExternalLinkInline, MotionButton } from '@/components/Button'
import SteamProfileComponent from '@/components/SteamProfile'
import {
  fadeInFastVariants,
  moveInLessVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import {
  settingsQueryOptions,
  useResetMutation,
  useUpdateMutation
} from '@/lib/data'
import useKeyPress from '@/lib/useKeyPress'

export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(settingsQueryOptions),
  component: Settings
})

function Settings() {
  const { data } = useSuspenseQuery(settingsQueryOptions)
  const router = useRouter()

  const onEscapePress = useCallback(
    async (event: KeyboardEvent) => {
      event.preventDefault()
      // event.stopPropagation()

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
  const { mutate } = useUpdateMutation()
  const scrollContainer = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      className="flex w-full select-none flex-col p-6"
      variants={fadeInFastVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className="w-full" variants={staggerChildrenVariants}>
        <motion.div variants={moveInLessVariants} className="-ml-2">
          <button
            onClick={() => router.navigate({ to: '/menu', replace: true })}
            className="group flex items-center gap-0.5 rounded-full px-1.5 font-medium text-zinc-400 transition-[box-shadow,color,background-color,border-color,transform] will-change-transform hover:text-zinc-50 focus-visible:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <XIcon size={20} />
            Close
            <span
              className={clsx(
                'm-0.5 ml-2 rounded border px-2.5 pb-px transition-[background-color,border-color,transform] duration-150 will-change-transform',
                pressed
                  ? 'scale-95 border-zinc-400 bg-zinc-200 text-zinc-700'
                  : 'border-zinc-700 bg-zinc-800'
              )}
            >
              Esc
            </span>
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
            {/* list battle.net and steam platforms, all steam users detected under it */}
            {/* button to scan steam users */}
            <motion.div className="flex gap-6 rounded-lg bg-zinc-800 p-2 shadow-inner shadow-zinc-900">
              <button
                className="group flex flex-col items-center gap-1 p-3 outline-none transition-transform duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
                onClick={() => {
                  if (data.platforms.includes('BattleNet')) {
                    // setPlatforms(data.platforms.filter((p) => p !== 'BattleNet'))
                    return
                  }
                  // setPlatforms([...platforms, 'BattleNet'])
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
                    'flex items-center gap-1.5 text-center font-medium transition',
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
              </button>
              <div
                className={clsx(
                  data.platforms.includes('Steam')
                    ? 'relative -ml-3 flex min-w-0 items-center gap-6 overflow-hidden rounded-md bg-zinc-700 py-3 pl-6 shadow-inner shadow-zinc-800'
                    : 'p-3'
                )}
              >
                <button
                  className="group flex flex-col items-center gap-1 outline-none transition-transform duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95"
                  onClick={() => {
                    if (data.platforms.includes('Steam')) {
                      // setPlatforms(platforms.filter((p) => p !== 'Steam'))
                      return
                    }
                    // setPlatforms([...platforms, 'Steam'])
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
                      'flex items-center gap-1.5 text-center font-medium transition',
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
                </button>
                {data.platforms.includes('Steam') && (
                  <div
                    className="scroller flex gap-6 overflow-x-auto py-2 after:pointer-events-none after:absolute after:bottom-5 after:right-0 after:z-10 after:h-[calc(100%-2rem)] after:w-8 after:content-[''] after:bg-easing-r-settings last:pr-5"
                    ref={scrollContainer}
                  >
                    {data.steamProfiles && data.steamProfiles.length > 0 ? (
                      <>
                        {data.steamProfiles.map((profile) => (
                          <SteamProfileComponent
                            key={profile.id}
                            account={profile}
                          />
                        ))}
                      </>
                    ) : (
                      <>No Steam Profiles</>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
            {/* <div className="h-64 w-full rounded-lg bg-zinc-700"></div> */}
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">Update</h2>
              <p className="">Check for updates.</p>
            </div>
            <MotionButton className="w-fit min-w-36" onClick={() => mutate()}>
              Check for Updates
            </MotionButton>
          </motion.div>
          <motion.div
            className="flex flex-col gap-1.5"
            variants={moveInLessVariants}
          >
            <div className="flex items-baseline gap-2.5 text-zinc-400">
              <h2 className="text-lg font-bold text-white">Reset</h2>
              <p className="">Reset all settings to default.</p>
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
      {/* <AnimatePresence mode="wait">
        {isConfirming === 'idle' && (
          <MotionButton
            key="button"
            className="w-fit min-w-40"
            onClick={() => setIsConfirming('confirm')}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.15 } }}
          >
            Reset Settings
          </MotionButton>
        )}
        {isConfirming === 'confirm' && (
          <>
            <MotionButton
              key="button"
              className="w-fit min-w-40"
              onClick={() => setIsConfirming('idle')}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              Cancel
            </MotionButton>
            <MotionButton
              key="confirm"
              destructive
              className="w-fit px-6"
              onClick={() => setIsConfirming('pending')}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              Confirm Reset Settings? (This action cannot be undone)
            </MotionButton>
          </>
        )}
      </AnimatePresence> */}
    </div>
  )
}
