import { createFileRoute, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, CircleIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import BattleNet from '@/assets/BattleNet.svg'
import Steam from '@/assets/Steam.svg'
import { ConfigError, ConfigErrors, Platform, useSetupMutation } from '@/data'
import { childVariants, containerVariants } from './-constants'

export const Route = createFileRoute('/setup/select')({
  component: SetupSelect
})

export function SetupSelect() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const navigate = useNavigate()
  const { status, mutate, reset } = useSetupMutation({
    onError: (error) => {
      if (error instanceof ConfigError) {
        toast.error(error.message)
        if (ConfigErrors.safeParse(error.error_key).success) {
          navigate({
            to: '/setup/$key',
            params: {
              key: error.error_key
            },
            search: {
              action: error.error_action || 'finding',
              platforms: error.platforms
            },
            replace: true
          })
        }
        return
      }
      toast.error(error.message)
      reset()
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
      className="mx-auto flex h-full max-w-xl select-none flex-col items-center justify-center pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="mb-6 flex flex-col items-center gap-2 text-center text-zinc-400">
        <motion.h1
          className="text-2xl font-medium text-white"
          variants={childVariants}
        >
          Select your Platform(s)
        </motion.h1>
        <motion.p variants={childVariants}>
          Select the platform(s) you use to play Overwatch™. This will allow
          OverBuddy to automatically detect your installation and apply the
          desired changes.
        </motion.p>
        <motion.p variants={childVariants}>
          You can change this later in the settings.
        </motion.p>
      </div>
      <motion.div className="mb-8 flex gap-8" variants={childVariants}>
        <button
          className="group outline-none"
          onClick={() => {
            if (platforms.includes('BattleNet')) {
              setPlatforms(platforms.filter((p) => p !== 'BattleNet'))
              return
            }
            setPlatforms([...platforms, 'BattleNet'])
          }}
        >
          <div className="flex flex-col items-center gap-2 transition-transform duration-200 will-change-transform group-active:scale-90">
            <img
              src={BattleNet}
              alt="Battle.net Logo"
              title="Battle.net"
              width="64px"
              height="64px"
              className={clsx(
                'rounded-full ring-white grayscale transition-[transform,filter,box-shadow] will-change-transform group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring',
                platforms.includes('BattleNet')
                  ? 'grayscale-0 group-active:grayscale'
                  : 'group-active:grayscale-0'
              )}
              draggable={false}
            />
            <h2
              className={clsx(
                'flex items-center gap-1 text-center font-medium transition-colors',
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
          </div>
        </button>
        <button
          className="group outline-none"
          onClick={() => {
            if (platforms.includes('Steam')) {
              setPlatforms(platforms.filter((p) => p !== 'Steam'))
              return
            }
            setPlatforms([...platforms, 'Steam'])
          }}
        >
          <div className="flex flex-col items-center gap-2 transition-transform duration-200 will-change-transform group-active:scale-90">
            <img
              src={Steam}
              alt="Steam Logo"
              title="Steam"
              width="64px"
              height="64px"
              className={clsx(
                'rounded-full ring-white grayscale transition-[transform,filter,box-shadow] will-change-transform group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring',
                platforms.includes('Steam')
                  ? 'grayscale-0 group-active:grayscale'
                  : 'group-active:grayscale-0'
              )}
              draggable={false}
            />
            <h2
              className={clsx(
                'flex items-center gap-1 text-center font-medium transition-colors',
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
          </div>
        </button>
      </motion.div>
      <motion.button
        className="w-full select-none rounded-lg bg-zinc-50 px-5 py-3 font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:!scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={status !== 'idle'}
        onClick={() => {
          if (platforms.length === 0) {
            toast.warning('You must select at least one platform.')
            return
          }
          mutate(platforms)
        }}
        variants={childVariants}
      >
        Continue
      </motion.button>
    </motion.div>
  )
}
