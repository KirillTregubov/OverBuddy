import { createFileRoute, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, CircleIcon, LoaderPinwheel } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import BattleNet from '@/assets/BattleNet.svg'
import Steam from '@/assets/Steam.svg'
import { Button } from '@/components/Button'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { useSetupMutation } from '@/lib/data'
import {
  ConfigError,
  ConfigErrors,
  SetupError,
  handleError
} from '@/lib/errors'
import { Platform } from '@/lib/schemas'

export const Route = createFileRoute('/setup/select')({
  component: SetupSelect
})

function SetupSelect() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const navigate = useNavigate()
  const { status, mutate, reset } = useSetupMutation({
    onError: (error) => {
      if (error instanceof SetupError) {
        handleError(error)
        reset()
      } else if (
        error instanceof ConfigError &&
        ConfigErrors.safeParse(error.error_key).success
      ) {
        navigate({
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
    onSuccess: () => {
      navigate({
        to: '/menu',
        replace: true
      })
    }
  })

  return (
    <motion.div
      className="mx-auto h-full w-full max-w-xl"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex h-full w-full select-none flex-col items-center justify-center gap-8"
        variants={staggerChildrenVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex flex-col items-center gap-2 text-center text-zinc-400">
          <motion.h1
            className="text-2xl font-medium text-white"
            variants={moveInVariants}
          >
            Connect your Platform(s)
          </motion.h1>
          <motion.p variants={moveInVariants}>
            Select the platform(s) you use to play Overwatch™. Overbuddy will
            automatically detect your installation(s) and any required
            configurations.
          </motion.p>
          <motion.p variants={moveInVariants}>
            You can change this later in the settings.
          </motion.p>
        </div>
        <motion.div className="flex gap-8" variants={moveInVariants}>
          <button
            className="group flex flex-col items-center gap-1 outline-none transition-transform duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95 disabled:pointer-events-none"
            onClick={() => {
              if (platforms.includes('BattleNet')) {
                setPlatforms(platforms.filter((p) => p !== 'BattleNet'))
                return
              }
              setPlatforms([...platforms, 'BattleNet'])
            }}
            title="Connect Battle.net"
            disabled={status !== 'idle'}
          >
            <img
              src={BattleNet}
              alt="Battle.net Logo"
              title="Battle.net"
              width="72px"
              height="72px"
              className={clsx(
                'rounded-full ring-white grayscale transition will-change-transform group-focus-visible:ring',
                platforms.includes('BattleNet')
                  ? 'grayscale-0 group-active:grayscale'
                  : 'group-active:grayscale-0'
              )}
            />
            <h2
              className={clsx(
                'flex items-center gap-1.5 text-center font-medium transition',
                platforms.includes('BattleNet')
                  ? 'text-white group-active:text-zinc-400'
                  : 'text-zinc-400 group-active:text-white'
              )}
            >
              <AnimatePresence mode="wait">
                {platforms.includes('BattleNet') ? (
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
          <button
            className="group flex flex-col items-center gap-1 outline-none transition-transform duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95 disabled:pointer-events-none"
            onClick={() => {
              if (platforms.includes('Steam')) {
                setPlatforms(platforms.filter((p) => p !== 'Steam'))
                return
              }
              setPlatforms([...platforms, 'Steam'])
            }}
            title="Connect Steam"
            disabled={status !== 'idle'}
          >
            <img
              src={Steam}
              alt="Steam Logo"
              title="Steam"
              width="72px"
              height="72px"
              className={clsx(
                'rounded-full ring-white grayscale transition will-change-transform group-focus-visible:ring',
                platforms.includes('Steam')
                  ? 'grayscale-0 group-active:grayscale'
                  : 'group-active:grayscale-0'
              )}
            />
            <h2
              className={clsx(
                'flex items-center gap-1.5 text-center font-medium transition',
                platforms.includes('Steam')
                  ? 'text-white group-active:text-zinc-400'
                  : 'text-zinc-400 group-active:text-white'
              )}
            >
              <AnimatePresence mode="wait">
                {platforms.includes('Steam') ? (
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
        </motion.div>
        {/* TODO: retry button */}
        <motion.div className="w-full" variants={moveInVariants}>
          <Button
            primary
            className="flex w-full items-center justify-center gap-2 py-3"
            disabled={status !== 'idle'}
            onClick={() => {
              if (platforms.length === 0) {
                toast.warning('You must select at least one platform.')
                return
              }
              mutate({ platforms })
            }}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="idle"
                >
                  Continue
                </motion.span>
              ) : status === 'pending' || status === 'success' ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="pending"
                >
                  <LoaderPinwheel className="animate-spin" />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
