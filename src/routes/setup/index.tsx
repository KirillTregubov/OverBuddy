import { createFileRoute } from '@tanstack/react-router'
import { BookLockIcon, GlobeIcon, SparklesIcon } from 'lucide-react'
import { motion } from 'motion/react'

import logo from '@/assets/logo.svg'
import { ExternalLinkInline, LinkButton } from '@/components/Button'
import CheckForUpdates from '@/components/CheckForUpdates'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { updateQueryOptions } from '@/lib/data'

export const Route = createFileRoute('/setup/')({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(updateQueryOptions(true)),
  component: SetupSplash
})

function SetupSplash() {
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
                Entertainment® or Valve®. You can undo the changes it makes at
                any time by reverting to the default background.
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
                your Battle.net® and/or Steam® configuration files. It does{' '}
                <span className="font-medium text-zinc-300">NOT</span> modify
                any game files. Your game client will be restarted to apply the
                changes.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
        <motion.div variants={moveInVariants} className="flex w-full">
          <LinkButton
            primary
            className="w-full py-3"
            to="/setup/select"
            replace
          >
            Continue
          </LinkButton>
        </motion.div>
        <CheckForUpdates />
      </motion.div>
    </motion.div>
  )
}
