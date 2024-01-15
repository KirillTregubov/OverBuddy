import { FileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/api/dialog'
import { ConfigError, ConfigErrorSchema, useSetupErrorMutation } from '../data'
import { appDataDir } from '@tauri-apps/api/path'
import { toast } from 'sonner'
import { invoke } from '@tauri-apps/api'
import { motion } from 'framer-motion'

export const Route = new FileRoute('/setup/$key').createRoute({
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
  const { key } = Route.useParams() as { key: ConfigErrorSchema['error_key'] }

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
      <motion.h1 className="mb-1 select-none text-lg font-bold" variants={item}>
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
              %APPDATA%\Battle.net
            </span>
            .
          </>
        )}
        {key === 'BattleNetInstall' && (
          <>
            Launcher. Please select the{' '}
            <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
              Battle.net Launcher.exe
            </span>{' '}
            file, which is likely located in{' '}
            <span className="select-all rounded-[0.2rem] bg-zinc-800 px-1.5 py-0.5">
              %PROGRAMFILES(X86)%\Battle.net
            </span>
            .
          </>
        )}
      </motion.h2>
      {key === 'BattleNetConfig' && (
        <motion.button
          className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-zinc-400 hover:bg-zinc-700/70 active:bg-zinc-600"
          onClick={async () => {
            const dir = await appDataDir()
            const defaultPath =
              dir.slice(0, dir.slice(0, -1).lastIndexOf('\\') + 1) +
              'Battle.net'
            const selected = await open({
              filters: [
                {
                  name: 'Configuration File',
                  extensions: ['config']
                }
              ],
              defaultPath: defaultPath
            })
            if (!selected) return
            if (selected.indexOf('Battle.net.config') === -1) {
              toast.error('Please select the "Battle.net.config" file.')
              return
            }
            mutation.mutate({
              key,
              path: selected as string
            })
          }}
          variants={item}
        >
          Select Battle.net.config
        </motion.button>
      )}
      {key === 'BattleNetInstall' && (
        <motion.button
          className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-zinc-400 hover:bg-zinc-700/70 active:bg-zinc-600"
          onClick={async () => {
            const dir = (await invoke('get_program_data')) as string
            console.log(dir)
            const defaultPath = dir + '\\Battle.net'
            const selected = await open({
              filters: [
                {
                  name: 'Battle.net Launcher',
                  extensions: ['exe']
                }
              ],
              defaultPath: defaultPath
            })
            if (!selected) return
            if (selected.indexOf('Battle.net Launcher.exe') === -1) {
              toast.error('Please select the "Battle.net Launcher.exe" file.')
              return
            }
            mutation.mutate({
              key,
              path: selected as string
            })
          }}
          variants={item}
        >
          Select Battle.net Launcher.exe
        </motion.button>
      )}
    </motion.div>
  )
}
