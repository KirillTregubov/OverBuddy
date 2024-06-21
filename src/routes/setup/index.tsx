import {
  createFileRoute
  // useNavigate
} from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BookLockIcon, GlobeIcon, SparklesIcon } from 'lucide-react'

import logo from '@/assets/logo.svg'
import { LinkButton } from '@/components/Button'
import { moveInVariants, staggerChildrenVariants } from '@/lib/animations'
// import { useSetupMutation } from '@/lib/data'
// import { ConfigError, ConfigErrors, handleError } from '@/lib/errors'

export const Route = createFileRoute('/setup/')({
  component: SetupSplash
})

function SetupSplash() {
  // const navigate = useNavigate()
  // const { status, mutate, reset } = useSetupMutation({
  //   onError: (error) => {
  //     if (
  //       error instanceof ConfigError &&
  //       ConfigErrors.safeParse(error.error_key).success
  //     ) {
  //       navigate({
  //         to: '/setup/$key',
  //         params: {
  //           key: error.error_key
  //         },
  //         search: {
  //           action: error.error_action || 'finding',
  //           platforms: error.platforms
  //         },
  //         replace: true
  //       })
  //       return
  //     }
  //     handleError(error)
  //     reset()
  //   },
  //   onSuccess: () => {
  //     navigate({
  //       to: '/menu',
  //       replace: true
  //     })
  //   }
  // })

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
        <motion.div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={moveInVariants}
          >
            <SparklesIcon size={20} />
          </motion.div>
          <motion.div variants={moveInVariants}>
            <motion.h2 className="mb-1 flex gap-2 text-lg font-medium text-white">
              Personalized Overwatch™ Experience
            </motion.h2>
            <motion.p>
              Explore all available backgrounds and select your favourite to
              customize your in-game menu.
            </motion.p>
          </motion.div>
        </motion.div>
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={moveInVariants}
          >
            <GlobeIcon size={20} />
          </motion.div>
          <motion.div variants={moveInVariants}>
            <motion.h2 className="mb-1 flex items-center gap-2 text-lg font-medium text-white">
              Free and Open Source
            </motion.h2>
            <motion.p>
              OverBuddy is free to use and open source. It operates
              independently and is not affiliated with Blizzard Entertainment®.
              You can undo the changes made by this app at any time by reverting
              to the default background.
            </motion.p>
          </motion.div>
        </div>
        <div className="flex items-start gap-4">
          <motion.div
            className="mt-1 rounded-lg bg-zinc-800 p-3 text-white"
            variants={moveInVariants}
          >
            <BookLockIcon size={20} />
          </motion.div>
          <motion.div variants={moveInVariants}>
            <motion.h2 className="mb-1 flex items-center gap-2 text-lg font-medium text-white">
              Privacy Notice
            </motion.h2>
            <motion.p>
              To change your background, this app needs to read and write your
              Battle.net®{/* or Steam®*/} configuration files. It does{' '}
              <span className="font-medium">NOT</span> modify any game files. To
              apply the changes, your Battle.net{/* or Steam*/} client will be
              automatically restarted.
            </motion.p>
          </motion.div>
        </div>
      </div>
      <motion.div variants={moveInVariants} className="flex w-full">
        <LinkButton
          primary
          className="w-full py-3"
          to="/setup/select"
          replace
          draggable={false}
        >
          Continue
        </LinkButton>
        {/* <Button
          primary
          disabled={status !== 'idle'}
          onClick={() => mutate(['BattleNet'])}
        >
          Continue
        </Button> */}
      </motion.div>
    </motion.div>
  )
}
