import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import {
  launchQueryOptions,
  steamQueryOptions,
  useSteamConfirmMutation
} from '@/lib/data'
import { useSuspenseQuery } from '@tanstack/react-query'
import { HashIcon } from 'lucide-react'

export const Route = createFileRoute('/setup/steam_setup')({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(steamQueryOptions)
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient.fetchQuery(launchQueryOptions)
    if (!is_setup || !steam.configs) {
      throw redirect({ to: '/' })
    }
  },
  component: SteamSetup
})

function SteamSetup() {
  const navigate = useNavigate()
  const { data: accounts } = useSuspenseQuery(steamQueryOptions)
  const { mutate, status } = useSteamConfirmMutation({
    onSuccess: () => {
      console.log('navigate')
      navigate({
        to: '/menu',
        replace: true
      })
    }
  })

  return (
    <motion.div
      className="mx-auto flex h-full max-w-xl pb-8"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex select-none flex-col items-center justify-center gap-8"
        variants={staggerChildrenVariants}
      >
        <div className="flex flex-col items-center gap-2 text-center text-zinc-400">
          <motion.h1
            className="text-2xl font-medium text-white"
            variants={moveInVariants}
          >
            Confirm Steam profile{accounts.length > 1 ? 's' : ''}
          </motion.h1>
          <motion.p variants={moveInVariants}>
            The following Steam profiles have been detected. New logins will be
            automatically detected, and can be scanned manually in the settings.
          </motion.p>
        </div>
        <motion.div className="flex gap-8" variants={moveInVariants}>
          {accounts.map((account) => (
            <motion.div key={account.id}>
              <img
                src={account.avatar}
                alt={account.name}
                className="mb-1 max-h-32 rounded"
              />
              <h2 className="font-medium text-white">{account.name}</h2>
              <h3 className="inline-flex items-center text-sm text-zinc-400">
                <HashIcon size={14} /> {account.id}
              </h3>
            </motion.div>
          ))}
        </motion.div>
        <motion.button
          className="w-full select-none rounded-lg bg-zinc-50 px-4 py-3 font-medium capitalize text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:!scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={status !== 'idle'}
          onClick={() => mutate()}
          variants={moveInVariants}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
