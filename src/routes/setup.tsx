import { fadeInVariants } from '@/lib/animations'
import { launchQueryOptions } from '@/lib/data'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router' //
import { motion } from 'framer-motion'

export const Route = createFileRoute('/setup')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch(() => {
        throw redirect({ to: '/' })
      })

    if (is_setup && (!steam.enabled || steam.setup)) {
      console.log('redirected with', steam)
      throw redirect({ to: '/menu' })
    }
  },
  component: Setup
})

const mode = import.meta.env.MODE === 'development' ? 'dev' : 'release'

function Setup() {
  return (
    <motion.div
      className="h-full w-full"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <Outlet />
      <motion.div
        className="absolute bottom-0 w-full select-none pb-3 text-center text-zinc-400"
        initial={{ transform: 'scale(.9)' }}
        animate={{ transform: 'scale(1)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="m-auto max-w-2xl">
          <p>
            Made with ❤️ by <span className="font-bold">Kirill Tregubov</span>.
            Version {import.meta.env.PACKAGE_VERSION} ({mode}).
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
