import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'

import Version from '@/components/Version'
import { fadeInVariants } from '@/lib/animations'
import { launchQueryOptions } from '@/lib/data'

export const Route = createFileRoute('/setup')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch(() => {
        throw redirect({ to: '/' })
      })

    if (is_setup && (!steam.enabled || steam.setup)) {
      throw redirect({ to: '/menu' })
    }
  },
  component: Setup
})

function Setup() {
  return (
    <motion.div
      className="relative h-full w-full pb-8"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <Outlet />
      <motion.div
        className="absolute bottom-0 w-full select-none pb-3 text-center text-zinc-400"
        initial={{ transform: 'scale(.95)' }}
        animate={{ transform: 'scale(1)' }}
        transition={{ transform: { duration: 0.3 } }}
      >
        <div className="m-auto max-w-xl">
          <p>
            Made with ❤️ by <span className="font-bold">Kirill Tregubov</span>.{' '} 
            <Version />.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
