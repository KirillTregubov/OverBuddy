import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/api/dialog'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ConfigError,
  ConfigErrors,
  Platform,
  getSetupPath,
  useSetupErrorMutation
} from '../../data'
import { childVariants, containerVariants } from './-constants'

export const Route = createFileRoute('/setup/$key')({
  loader: ({ params: { key }, context: { queryClient } }) => {
    const result = ConfigErrors.safeParse(key)
    if (!result.success) {
      throw Error('Invalid key')
    }
    queryClient.ensureQueryData(getSetupPath(result.data))
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      action: (search.action as string) || 'finding',
      platforms: (search.platforms as Platform[]) || []
    }
  },
  staleTime: Infinity,
  // TODO: Design loading component
  pendingComponent: () => <div>Loading...</div>,
  component: ConfigureComponent
})

function ConfigureComponent() {
  const navigate = useNavigate()
  const { key } = Route.useParams() as { key: ConfigErrors }
  const { action, platforms } = Route.useSearch()
  const { data: defaultPath } = useSuspenseQuery(getSetupPath(key))

  const mutation = useSetupErrorMutation({
    onSuccess: async () => {
      navigate({
        to: '/menu',
        replace: true
      })
    },
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
            search: {
              action: error.error_action || 'finding',
              platforms: error.platforms
            },
            replace: true
          })
        }
        return
      }
      toast.error(error.message)
    }
  })

  return (
    <motion.div
      className="mx-auto flex h-full max-w-lg flex-col items-center justify-center text-center"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        className="mb-1 select-none text-xl font-bold"
        variants={childVariants}
      >
        Something went wrong
      </motion.h1>
      <motion.h2
        className="select-none leading-7 text-zinc-400"
        variants={childVariants}
      >
        There was an error {action} your{' '}
        {key === 'BattleNetInstall' ? (
          <>
            Battle.net Launcher. If you have Overwatch installed through Steam,
            please wait for a future update.
            <span className="mt-2 block">
              If you do have Battle.net installed, please select the{' '}
              <span className="select-all whitespace-nowrap rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
                Battle.net Launcher.exe
              </span>{' '}
              file, which is likely located in{' '}
              <span className="select-all whitespace-nowrap rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
                {defaultPath}
              </span>
              .
            </span>
          </>
        ) : key === 'BattleNetConfig' ? (
          <>
            Battle.net configuration file. Please select the{' '}
            <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
              Battle.net.config
            </span>{' '}
            file, which is likely located in{' '}
            <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
              {defaultPath}
            </span>
            .
          </>
        ) : (
          key === 'SteamInstall' && (
            <>
              Steam installation. Please select the{' '}
              <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
                steam.exe
              </span>{' '}
              file, which is likely located in{' '}
              <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
                {defaultPath}
              </span>
              .
            </>
          )
        )}
      </motion.h2>
      <motion.button
        className="mt-4 select-none rounded-lg bg-zinc-800 px-4 py-2 text-zinc-400 transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:!scale-95"
        onClick={async () => {
          const selected = await open({
            filters: [
              {
                name:
                  key === 'BattleNetInstall'
                    ? 'Battle.net Launcher'
                    : key === 'BattleNetConfig'
                      ? 'Configuration File'
                      : 'steam',
                extensions: [key.endsWith('Config') ? 'config' : 'exe']
              }
            ],
            defaultPath
          })
          if (!selected) return
          const file =
            key === 'BattleNetInstall'
              ? 'Battle.net Launcher.exe'
              : key === 'BattleNetConfig'
                ? 'Battle.net.config'
                : 'steam.exe'
          if (selected.indexOf(file) === -1) {
            toast.error(`Please select the "${file}" file.`)
            return
          }
          mutation.mutate({
            key,
            path: selected as string,
            platforms
          })
        }}
        variants={childVariants}
      >
        Select{' '}
        {key === 'BattleNetInstall'
          ? 'Battle.net Launcher.exe'
          : key === 'BattleNetConfig'
            ? 'Battle.net.config'
            : 'steam.exe'}
      </motion.button>
    </motion.div>
  )
}
