import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'

import { Button, MotionButton } from '@/components/Button'
import { FormattedError } from '@/components/Error'
import ErrorWrapper from '@/components/ErrorWrapper'
import Highlight from '@/components/Highlight'
import { getSetupPath, useSetupErrorMutation } from '@/lib/data'
import { ConfigError, ConfigErrors, handleError } from '@/lib/errors'
import { type Platform } from '@/lib/schemas'

export const Route = createFileRoute('/setup/$key')({
  loader: async ({ params: { key }, context: { queryClient } }) => {
    const result = ConfigErrors.safeParse(key)
    if (!result.success) {
      throw Error('Invalid key')
    }
    await queryClient.ensureQueryData(getSetupPath(result.data))
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
      }

      handleError(error)
      reset()
    }
  })

  return (
    <ErrorWrapper
      title="Setup Incomplete"
      description={
        <>
          <p className="mb-2 text-pretty leading-7 text-zinc-400">
            <FormattedError text={message} />
          </p>
          <p className="text-pretty leading-7 text-zinc-400">
            {key === 'BattleNetInstall' ? (
              <>
                If you have Battle.net installed, please select the{' '}
                <Highlight>Battle.net Launcher.exe</Highlight> file, which is
                located in your Battle.net installation directory
                {!!path && (
                  <>
                    {' '}
                    (defaults to <Highlight>{path}</Highlight>)
                  </>
                )}
                .
              </>
            ) : key === 'BattleNetConfig' ? (
              <>
                Please select the <Highlight>Battle.net.config</Highlight> file
                {!!path && (
                  <>
                    , which is expected to be located in{' '}
                    <Highlight>{path}</Highlight>
                  </>
                )}
                .
              </>
            ) : key === 'SteamInstall' ? (
              <>
                If you have Steam installed, please select the{' '}
                <Highlight>steam.exe</Highlight> file, which is located in your
                Steam installation directory (defaults to{' '}
                <Highlight>{path}</Highlight>).
              </>
            ) : (
              key === 'SteamAccount' && (
                <>
                  Please ensure you have logged into an account on Steam. If you
                  have already done so, please select the correct{' '}
                  <Highlight>steam.exe</Highlight> file, which is located in
                  your Steam installation directory (defaults to{' '}
                  <Highlight>{path}</Highlight>).
                </>
              )
            )}
          </p>
        </>
      }
      buttons={
        <>
          {/* TODO: SteamAccount Untested */}
          {key === 'SteamAccount' ? (
            <MotionButton
              primary
              onClick={() => {
                mutate({
                  key,
                  path: undefined,
                  platforms
                })
              }}
            >
              Retry
            </MotionButton>
          ) : (
            <Button
              onClick={() => {
                navigate({
                  to: '/setup/select',
                  replace: true
                })
              }}
            >
              Go Back
            </Button>
          )}
          <MotionButton
            primary
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
                defaultPath: defaultPath || undefined
              })
              if (!selected) return
              const file =
                key === 'BattleNetInstall'
                  ? 'Battle.net Launcher.exe'
                  : key === 'BattleNetConfig'
                    ? 'Battle.net.config'
                    : 'steam.exe'
              if (selected.indexOf(file) === -1) {
                toast.error(`Please select the "${file}" file.`, {
                  closeButton: false
                })
                return
              }
              mutate({
                key,
                path: selected as string,
                platforms
              })
            }}
          >
            Select{' '}
            {key === 'BattleNetInstall'
              ? 'Battle.net Launcher.exe'
              : key === 'BattleNetConfig'
                ? 'Battle.net.config'
                : 'steam.exe'}
          </MotionButton>
          {/* TODO: report issue */}
        </>
      }
    />
  )
}
