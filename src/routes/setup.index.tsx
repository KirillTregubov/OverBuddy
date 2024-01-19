import { FileRoute, useNavigate } from '@tanstack/react-router'
import { ConfigError, useSetupMutation } from '../data'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export const Route = new FileRoute('/setup/').createRoute({
  component: SetupSplash
})

const container = {
  show: {
    transition: {
      staggerChildren: 0.02
    }
  }
}

const item = {
  hidden: { transform: 'translateY(20px)' },
  show: {
    transform: 'translateY(0)',
    transition: {
      duration: 0.3
    }
  }
}

export function SetupSplash() {
  const navigate = useNavigate()
  const mutation = useSetupMutation({
    onError: (error) => {
      if (error instanceof ConfigError) {
        toast.error(error.message)
        if (
          error.error_key === 'BattleNetConfig' ||
          error.error_key === 'BattleNetInstall'
        ) {
          navigate({
            to: '/setup/$key',
            params: {
              key: error.error_key
            },
            replace: true
          })
        }
        return
      }
      toast.error(error.message)
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
      className="mx-auto flex h-full max-w-lg select-none flex-col items-center justify-center"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 className="mb-10 text-2xl font-medium" variants={item}>
        Welcome to <span className="font-bold">OverBuddy</span>!
      </motion.h1>
      <div className="mb-8 flex flex-col gap-5 text-zinc-400">
        <div>
          <motion.h2
            className="mb-1 text-lg font-medium text-white"
            variants={item}
          >
            Personalized Overwatch™ Experience
          </motion.h2>
          <motion.p variants={item}>
            Explore all available backgrounds and select your favourite to
            customize your in-game menu.
          </motion.p>
        </div>
        <div>
          <motion.h2
            className="mb-1 text-lg font-medium text-white"
            variants={item}
          >
            Free and Open Source
          </motion.h2>
          <motion.p variants={item}>
            OverBuddy is free to use and open source. It operates independently
            and is not affiliated with Blizzard Entertainment®. You can revert
            the changes made by this app at any time in the settings.
          </motion.p>
        </div>
        <div>
          <motion.h2
            className="mb-1 text-lg font-medium text-white"
            variants={item}
          >
            Privacy Notice
          </motion.h2>
          <motion.p variants={item}>
            To change your background, this app needs to read and write your
            Battle.net® configuration files. It does{' '}
            <span className="font-medium">NOT</span> modify any game files. To
            apply the changes, your Battle.net® client needs to be restarted.
          </motion.p>
        </div>
      </div>
      <motion.button
        className="w-full select-none rounded-lg bg-zinc-50 px-5 py-3 font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:!scale-95"
        onClick={() => mutation.mutate()}
        variants={item}
      >
        Continue
      </motion.button>
    </motion.div>
  )
}
