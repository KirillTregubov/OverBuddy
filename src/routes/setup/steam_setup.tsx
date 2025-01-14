import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { z } from 'zod'

import { MotionButton } from '@/components/Button'
import SteamProfileComponent from '@/components/SteamProfile'
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

export const Route = createFileRoute('/setup/steam_setup')({
  validateSearch: z.object({
    redirect: z.string().optional()
  }),
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient.fetchQuery(launchQueryOptions)
    if (!is_setup || !steam.configs) {
      throw redirect({ to: '/' })
    }
  },
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(steamQueryOptions)
  },
  component: SteamSetup
})

function SteamSetup() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const { data: profiles } = useSuspenseQuery(steamQueryOptions)
  const { mutate, status } = useSteamConfirmMutation({
    onError: () => {
      navigate({
        to: '/setup/NoSteamOverwatch',
        search: {
          redirect
        },
        replace: true
      })
    },
    onSuccess: () => {
      if (redirect) {
        navigate({
          to: redirect,
          replace: true
        })
      } else {
        navigate({
          to: '/menu',
          replace: true
        })
      }
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
        <div className="flex flex-col items-center gap-2 text-center text-zinc-400">
          <motion.h1
            className="text-2xl font-medium text-white"
            variants={moveInVariants}
          >
            Confirm Steam Account{profiles.length > 1 ? 's' : ''}
          </motion.h1>
          <motion.p variants={moveInVariants}>
            OverBuddy has detected the following Steam account
            {profiles.length > 1 ? 's' : ''}.
          </motion.p>
          <motion.p variants={moveInVariants}>
            New accounts will be automatically detected.
          </motion.p>
        </div>
        <motion.div className="flex gap-8" variants={moveInVariants}>
          {profiles.map((profile) => (
            <SteamProfileComponent key={profile.id} account={profile} large />
          ))}
        </motion.div>
        <MotionButton
          primary
          className="w-full py-3"
          disabled={status !== 'idle'}
          onClick={() => mutate()}
          variants={moveInVariants}
        >
          Confirm
        </MotionButton>
      </motion.div>
    </motion.div>
  )
}
