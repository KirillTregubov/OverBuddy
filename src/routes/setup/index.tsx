import {
  // Link,
  createFileRoute,
  useNavigate
} from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BookLockIcon, GlobeIcon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'

import logo from '@/assets/logo.svg'
import { ConfigError, ConfigErrors, useSetupMutation } from '@/lib/data'
import { childVariants, containerVariants } from './-constants'

export const Route = createFileRoute('/setup/')({
  component: SetupSplash
})

export function SetupSplash() {
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
      <motion.img
        className="mb-2"
        src={logo}
        alt="OverBuddy Logo"
        variants={childVariants}
        draggable={false}
        width="64px"
        height="64px"
      />
      <motion.h1 className="mb-8 text-2xl font-medium" variants={childVariants}>
        Welcome to <span className="font-bold">OverBuddy</span>!
      </motion.h1>
      <div className="mb-10 flex flex-col gap-5 text-zinc-400">
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={childVariants}
          >
            <SparklesIcon size={20} />
          </motion.div>
          <div>
            <motion.h2
              className="mb-1 flex gap-2 text-lg font-medium text-white"
              variants={childVariants}
            >
              Personalized Overwatch™ Experience
            </motion.h2>
            <motion.p variants={childVariants}>
              Explore all available backgrounds and select your favourite to
              customize your in-game menu.
            </motion.p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={childVariants}
          >
            <GlobeIcon size={20} />
          </motion.div>
          <div>
            <motion.h2
              className="mb-1 flex items-center gap-2 text-lg font-medium text-white"
              variants={childVariants}
            >
              Free and Open Source
            </motion.h2>
            <motion.p variants={childVariants}>
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
            variants={childVariants}
          >
            <BookLockIcon size={20} />
          </motion.div>
          <div>
            <motion.h2
              className="mb-1 flex items-center gap-2 text-lg font-medium text-white"
              variants={childVariants}
            >
              Privacy Notice
            </motion.h2>
            <motion.p variants={childVariants}>
              To change your background, this app needs to read and write your
              Battle.net®{/* or Steam®*/} configuration files. It does{' '}
              <span className="font-medium">NOT</span> modify any game files. To
              apply the changes, your Battle.net{/* or Steam*/} client will be
              automatically restarted.
            </motion.p>
          </div>
        </div>
      </div>
      <motion.div variants={childVariants} className="flex w-full">
        {/* <Link
          className="w-full select-none rounded-lg bg-zinc-50 px-5 py-3 text-center font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95"
          to="/setup/select"
          replace
          draggable={false}
        >
          Continue
        </Link> */}
        <button
          className="w-full select-none rounded-lg bg-zinc-50 px-5 py-3 text-center font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95"
          disabled={status !== 'idle'}
          onClick={() => mutate(['BattleNet'])}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  )
}
