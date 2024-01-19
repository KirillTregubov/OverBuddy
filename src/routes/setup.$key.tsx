import { FileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/api/dialog'
import {
  ConfigError,
  ConfigErrors,
  getSetupDirectory,
  useSetupErrorMutation
} from '../data'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = new FileRoute('/setup/$key').createRoute({
  loader: ({ params: { key }, context: { queryClient } }) => {
    if (key !== 'BattleNetConfig' && key !== 'BattleNetInstall') {
      throw Error('Invalid key')
    }
    queryClient.ensureQueryData(getSetupDirectory(key))
  },
  staleTime: Infinity,
  // TODO: Design loading component
  pendingComponent: () => <div>Loading...</div>,
  component: ConfigureComponent
})

const container = {
  show: {
    transition: {
      staggerChildren: 0.02
    }
  }
}

const item = {
  hidden: { transform: 'translateY(20px)' },
  show: {
    transform: 'translateY(0)',
    transition: {
      duration: 0.3
    }
  }
}

function ConfigureComponent() {
  const navigate = useNavigate()
  const { key } = Route.useParams() as { key: ConfigErrors }
  const { data: defaultPath } = useSuspenseQuery(getSetupDirectory(key))
  console.log(defaultPath)

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
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 className="mb-1 select-none text-xl font-bold" variants={item}>
        Something went wrong
      </motion.h1>
      <motion.h2
        className="select-none leading-7 text-zinc-400"
        variants={item}
      >
        There was an error finding your Battle.net{' '}
        {key === 'BattleNetConfig' && (
          <>
            configuration file. Please select the{' '}
            <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
              Battle.net.config
            </span>{' '}
            file, which is likely located in{' '}
            <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
              {defaultPath}
            </span>
            .
          </>
        )}
        {key === 'BattleNetInstall' && (
          <>
            Launcher. If you have Overwatch installed through Steam, please wait
            for a future update.
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
        )}
      </motion.h2>
      <motion.button
        className="mt-4 select-none rounded-lg bg-zinc-800 px-4 py-2 text-zinc-400 transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:!scale-95"
        onClick={async () => {
          const selected = await open({
            filters: [
              {
                name:
                  key === 'BattleNetConfig'
                    ? 'Configuration File'
                    : 'Battle.net Launcher',
                extensions: [key === 'BattleNetConfig' ? 'config' : 'exe']
              }
            ],
            defaultPath
          })
          if (!selected) return
          const file =
            key === 'BattleNetConfig'
              ? 'Battle.net.config'
              : 'Battle.net Launcher.exe'
          if (selected.indexOf(file) === -1) {
            toast.error(`Please select the "${file}" file.`)
            return
          }
          mutation.mutate({
            key,
            path: selected as string
          })
        }}
        variants={item}
      >
        Select{' '}
        {key === 'BattleNetConfig'
          ? 'Battle.net.config'
          : 'Battle.net Launcher.exe'}
      </motion.button>
    </motion.div>
  )
}
