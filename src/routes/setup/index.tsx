import {
  // Link,
  createFileRoute,
  useNavigate
} from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BookLockIcon, GlobeIcon, SparklesIcon } from 'lucide-react'

import logo from '@/assets/logo.svg'
import { moveInVariants, staggerChildrenVariants } from '@/lib/animations'
import { useSetupMutation } from '@/lib/data'
import { ConfigError, ConfigErrors, handleError } from '@/lib/errors'

export const Route = createFileRoute('/setup/')({
  component: SetupSplash
})

export function SetupSplash() {
  const navigate = useNavigate()
  const { status, mutate, reset } = useSetupMutation({
    onError: (error) => {
      if (
        error instanceof ConfigError &&
        ConfigErrors.safeParse(error.error_key).success
      ) {
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
        return
      }
      handleError(error)
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
      variants={staggerChildrenVariants}
    >
      <motion.img
        className="mb-2"
        src={logo}
        alt="OverBuddy Logo"
        variants={moveInVariants}
        draggable={false}
        width="64px"
        height="64px"
      />
      <motion.h1
        className="mb-8 text-2xl font-medium"
        variants={moveInVariants}
      >
        Welcome to <span className="font-bold">OverBuddy</span>!
      </motion.h1>
      <div className="mb-10 flex flex-col gap-5 text-zinc-400">
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={moveInVariants}
          >
            <SparklesIcon size={20} />
          </motion.div>
          <div>
            <motion.h2
              className="mb-1 flex gap-2 text-lg font-medium text-white"
              variants={moveInVariants}
            >
              Personalized Overwatch™ Experience
            </motion.h2>
            <motion.p variants={moveInVariants}>
              Explore all available backgrounds and select your favourite to
              customize your in-game menu.
            </motion.p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={moveInVariants}
          >
            <GlobeIcon size={20} />
          </motion.div>
          <div>
            <motion.h2
              className="mb-1 flex items-center gap-2 text-lg font-medium text-white"
              variants={moveInVariants}
            >
              Free and Open Source
            </motion.h2>
            <motion.p variants={moveInVariants}>
              OverBuddy is free to use and open source. It operates
              independently and is not affiliated with Blizzard Entertainment®.
              You can undo the changes made by this app at any time by reverting
              to the default background.
            </motion.p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={moveInVariants}
          >
            <BookLockIcon size={20} />
          </motion.div>
          <div>
            <motion.h2
              className="mb-1 flex items-center gap-2 text-lg font-medium text-white"
              variants={moveInVariants}
            >
              Privacy Notice
            </motion.h2>
            <motion.p variants={moveInVariants}>
              To change your background, this app needs to read and write your
              Battle.net®{/* or Steam®*/} configuration files. It does{' '}
              <span className="font-medium">NOT</span> modify any game files. To
              apply the changes, your Battle.net{/* or Steam*/} client will be
              automatically restarted.
            </motion.p>
          </div>
        </div>
      </div>
      <motion.div variants={moveInVariants} className="flex w-full">
        {/* <Link
          className="w-full select-none rounded-lg bg-zinc-50 px-4 py-3 text-center font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95"
          to="/setup/select"
          replace
          draggable={false}
        >
          Continue
        </Link> */}
        <button
          className="w-full select-none rounded-lg bg-zinc-50 px-4 py-3 text-center font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={status !== 'idle'}
          onClick={() => mutate(['BattleNet'])}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  )
}
