import { fadeInVariants } from '@/lib/animations'
import { launchQueryOptions } from '@/lib/data'
import { isDev } from '@/lib/dev'
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

const mode = isDev() ? 'dev' : 'release'

function Setup() {
  return (
    <motion.div
      className="relative mx-auto h-full w-full max-w-xl pb-8"
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
            Made with ❤️ by <span className="font-bold">Kirill Tregubov</span>.
            Version{' '}
            <span className="proportional-nums">
              {import.meta.env.PACKAGE_VERSION}
            </span>{' '}
            ({mode}).
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
