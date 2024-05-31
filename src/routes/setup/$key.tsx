import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/api/dialog'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import Highlight from '@/components/Highlight'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { getSetupPath, useSetupErrorMutation } from '@/lib/data'
import { ConfigError, ConfigErrors, handleError } from '@/lib/errors'
import { type Platform } from '@/lib/schemas'
import clsx from 'clsx'
import { useState } from 'react'

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
  component: ConfigureComponent
})

function ConfigureComponent() {
  const navigate = useNavigate()
  const { key } = Route.useParams() as { key: ConfigErrors }
  const { action, platforms } = Route.useSearch()
  const { data: defaultPath } = useSuspenseQuery(getSetupPath(key))
  const [imageLoaded, setImageLoaded] = useState(false)

  const { mutate } = useSetupErrorMutation({
    onSuccess: async () => {
      navigate({
        to: '/menu',
        replace: true
      })
    },
    onError: (error) => {
      if (error instanceof ConfigError) {
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
          return
        }
      }
      handleError(error)
    }
  })

  return (
    <motion.div
      className="flex h-full w-full"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex flex-col justify-center p-8 pr-0"
        variants={staggerChildrenVariants}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          className="mb-1 select-none text-xl font-bold"
          variants={moveInVariants}
        >
          Setup Error
        </motion.h1>
        <motion.h2
          className="text-balance leading-7 text-zinc-400"
          variants={moveInVariants}
        >
          There was an error {action} your{' '}
          {key === 'BattleNetInstall' ? (
            <>
              Battle.net Launcher. If you have Overwatch installed through
              Steam, please wait for a future update.
              <span className="mt-2 block">
                If you do have Battle.net installed, please select the{' '}
                <Highlight>Battle.net Launcher.exe</Highlight> file, which is
                likely located in <Highlight>{defaultPath}</Highlight>.
              </span>
            </>
          ) : key === 'BattleNetConfig' ? (
            <>
              Battle.net configuration file. Please select the{' '}
              <Highlight>Battle.net.config</Highlight> file, which is likely
              located in <Highlight>{defaultPath}</Highlight>.
            </>
          ) : (
            key === 'SteamInstall' && (
              <>
                Steam installation. Please select the{' '}
                <Highlight>steam.exe</Highlight> file, which is likely located
                in <Highlight>{defaultPath}</Highlight>.
              </>
            )
          )}
        </motion.h2>
        <motion.button
          className="mt-4 select-none self-start rounded-lg bg-zinc-800 px-4 py-2 font-medium text-white transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:!scale-95"
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
            mutate({
              key,
              path: selected as string,
              platforms
            })
          }}
          variants={moveInVariants}
        >
          Select{' '}
          {key === 'BattleNetInstall'
            ? 'Battle.net Launcher.exe'
            : key === 'BattleNetConfig'
              ? 'Battle.net.config'
              : 'steam.exe'}
        </motion.button>
      </motion.div>
      <img
        src="/tracer.png"
        alt="logo"
        className={clsx(
          'h-full w-auto pb-6 pt-20 transition-opacity duration-500',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="eager"
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />
    </motion.div>
  )
}
