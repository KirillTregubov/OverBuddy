import {
  createFileRoute,
  useNavigate
  // useNavigate
} from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BookLockIcon, GlobeIcon, SparklesIcon } from 'lucide-react'

import logo from '@/assets/logo.svg'
import { Button, ExternalLinkInline } from '@/components/Button'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { useSetupMutation } from '@/lib/data'
import {
  ConfigError,
  ConfigErrors,
  handleError,
  SetupError
} from '@/lib/errors'

export const Route = createFileRoute('/setup/')({
  component: SetupSplash
})

function SetupSplash() {
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
      >
        <div className="flex flex-col items-center gap-2">
          <motion.img
            src={logo}
            alt="OverBuddy Logo"
            variants={moveInVariants}
            width="64px"
            height="64px"
          />
          <motion.h1 className="text-2xl font-medium" variants={moveInVariants}>
            Welcome to <span className="font-bold">OverBuddy</span>!
          </motion.h1>
        </div>
        <div className="flex flex-col gap-5 text-zinc-400">
          <motion.div
            className="flex items-start gap-4"
            variants={moveInVariants}
          >
            <motion.div className="mt-1 rounded-lg bg-zinc-800 p-3 text-white">
              <SparklesIcon size={20} />
            </motion.div>
            <motion.div>
              <motion.h2 className="mb-1 flex gap-2 text-lg font-medium text-white">
                Personalized Overwatch™ Experience
              </motion.h2>
              <motion.p>
                Customize your Overwatch main menu background to your liking.
                Browse all available backgrounds.
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex items-start gap-4"
            variants={moveInVariants}
          >
            <motion.div className="mt-1 rounded-lg bg-zinc-800 p-3 text-white">
              <GlobeIcon size={20} />
            </motion.div>
            <motion.div>
              <motion.h2 className="mb-1 flex items-center gap-2 text-lg font-medium text-white">
                Free and Transparent
              </motion.h2>
              <motion.p>
                OverBuddy is free to use and{' '}
                <ExternalLinkInline href={import.meta.env.REPOSITORY_URL}>
                  open source
                </ExternalLinkInline>
                . It operates independently and is not affiliated with Blizzard
                Entertainment®{/*or Valve®*/}. You can undo the changes it
                makes at any time by reverting to the default background.
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex items-start gap-4"
            variants={moveInVariants}
          >
            <motion.div className="mt-1 rounded-lg bg-zinc-800 p-3 text-white">
              <BookLockIcon size={20} />
            </motion.div>
            <motion.div>
              <motion.h2 className="mb-1 flex items-center gap-2 text-lg font-medium text-white">
                Built with Privacy in Mind
              </motion.h2>
              <motion.p className="text-pretty">
                To change the menu background, OverBuddy needs to read and write
                your Battle.net® {/* or Steam® */}configuration files. It does{' '}
                <span className="font-medium">NOT</span> modify any game files.
                Your Battle.net {/*or Steam */}
                client will be restarted to apply the changes.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
        <motion.div variants={moveInVariants} className="flex w-full">
          {/* <LinkButton
            primary
            className="w-full py-3"
            to="/setup/select"
            replace
          >
            Continue
          </LinkButton> */}
          <Button
            primary
            className="w-full py-3"
            disabled={status !== 'idle'}
            onClick={() => mutate({ platforms: ['BattleNet'] })}
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
