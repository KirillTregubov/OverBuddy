import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/api/dialog'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { MotionButton } from '@/components/Button'
import Highlight from '@/components/Highlight'
import TracerImage from '@/components/TracerImage'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { getSetupPath, useSetupErrorMutation } from '@/lib/data'
import {
  ConfigError,
  ConfigErrors,
  FormattedError,
  handleError
} from '@/lib/errors'
import { type Platform } from '@/lib/schemas'

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
      message: search.message as string,
      platforms: (search.platforms as Platform[]) || []
    }
  },
  staleTime: Infinity,
  component: ConfigureComponent
})

function ConfigureComponent() {
  const navigate = useNavigate()
  const { key } = Route.useParams() as { key: ConfigErrors }
  const { message, platforms } = Route.useSearch()
  const {
    data: { path, defaultPath }
  } = useSuspenseQuery(getSetupPath(key))

  const { mutate, reset } = useSetupErrorMutation({
    onSuccess: async () => {
      navigate({
        to: '/menu',
        replace: true
      })
    },
    onError: (error) => {
      console.log(error)
      if (
        error instanceof ConfigError &&
        ConfigErrors.safeParse(error.error_key).success
      ) {
        navigate({
          to: '/setup/$key',
          params: {
            key: error.error_key
          },
          search: {
            message: error.message,
            platforms: error.platforms
          },
          replace: true
        })
        handleError(error)
        reset()
      }
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
          Setup Incomplete
        </motion.h1>
        <motion.p
          className="mb-2 text-pretty leading-7 text-zinc-400"
          variants={moveInVariants}
        >
          <FormattedError text={message} />
        </motion.p>
        <motion.p
          className="text-pretty leading-7 text-zinc-400"
          variants={moveInVariants}
        >
          {key === 'BattleNetInstall' ? (
            <>
              {' '}
              If you have Overwatch installed through Steam, please wait for a
              future update.
              <span className="mt-2 block">
                If you do have Battle.net installed, please select the{' '}
                <Highlight>Battle.net Launcher.exe</Highlight> file, which is
                likely located in <Highlight>{path}</Highlight>.
              </span>
            </>
          ) : key === 'BattleNetConfig' ? (
            <>
              {' '}
              Please select the <Highlight>Battle.net.config</Highlight> file,
              which is likely located in <Highlight>{path}</Highlight>.
            </>
          ) : key === 'SteamInstall' ? (
            <>
              {' '}
              Please select the <Highlight>steam.exe</Highlight> file, which is
              located in your Steam installation directory (defaults to{' '}
              <Highlight>{path}</Highlight>).
            </>
          ) : (
            key === 'SteamAccount' && (
              <>
                {' '}
                Please ensure you have logged into an account on Steam. If you
                have already done so, please select the{' '}
                <Highlight>steam.exe</Highlight> file, which is located in your
                Steam installation directory (defaults to{' '}
                <Highlight>{path}</Highlight>).
              </>
            )
          )}
        </motion.p>

        <div className="mt-4 flex gap-2">
          {key === 'SteamAccount' && (
            <MotionButton
              primary
              onClick={() => {
                mutate({
                  key,
                  path: undefined,
                  platforms
                })
              }}
              variants={moveInVariants}
            >
              Retry
            </MotionButton>
          )}
          <MotionButton
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
          </MotionButton>
          {/* TODO: report issue */}
        </div>
      </motion.div>
      <TracerImage />
    </motion.div>
  )
}
