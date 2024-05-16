import { launchQueryOptions } from '@/lib/data'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/setup')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup } = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch(() => {
        throw redirect({ to: '/' })
      })

    if (is_setup) {
      throw redirect({ to: '/menu' })
    }
  },
  component: Setup
})

export function Setup() {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Outlet />
      <motion.div
        className="absolute bottom-0 w-full select-none pb-2.5 text-center text-zinc-400"
        initial={{ transform: 'scale(.9)' }}
        animate={{ transform: 'scale(1)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="m-auto max-w-2xl">
          <p>
            Made with ❤️ by <span className="font-bold">Kirill Tregubov</span>.
            Version {import.meta.env.PACKAGE_VERSION} (release).
          </p>
          {/* <p>
            Blizzard Entertainment, Battle.net and Overwatch are trademarks or
            registered trademarks of Blizzard Entertainment, Inc. in the U.S.
            and/or other countries.
          </p> */}
        </div>
      </motion.div>
    </motion.div>
  )
}
