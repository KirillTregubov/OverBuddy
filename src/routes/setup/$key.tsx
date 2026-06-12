import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'
import * as z from 'zod'

import { SetupIncompleteView } from '@/components/SetupViews'
import {
  getSetupPath,
  launchQueryOptions,
  useSetupErrorMutation,
} from '@/lib/data'
import { ConfigError, ConfigErrors, handleError } from '@/lib/errors'
import { Platform, RedirectSearchParam } from '@/lib/schemas'

export const Route = createFileRoute('/setup/$key')({
  validateSearch: RedirectSearchParam.extend({
    message: z.string(),
    platforms: z.array(Platform).default([]),
  }),
  loader: async ({ params: { key }, context: { queryClient } }) => {
    const result = ConfigErrors.safeParse(key)
    if (!result.success) {
      throw Error('Invalid key')
    }
    await queryClient.ensureQueryData(getSetupPath(result.data))
  },
  staleTime: Infinity,
  component: ConfigureComponent,
})

function ConfigureComponent() {
  const navigate = useNavigate()
  const { key } = Route.useParams() as { key: ConfigErrors }
  const { message, platforms, redirect } = Route.useSearch()
  const {
    data: { path, defaultPath },
  } = useSuspenseQuery(getSetupPath(key))
  const {
    data: { is_setup },
  } = useSuspenseQuery(launchQueryOptions)

  const { mutate, reset } = useSetupErrorMutation({
    onSuccess: async () => {
      if (redirect) {
        navigate({
          to: redirect,
          replace: true,
        })
      } else {
        navigate({
          to: '/menu',
          replace: true,
        })
      }
    },
    onError: (error) => {
      if (
        error instanceof ConfigError &&
        ConfigErrors.safeParse(error.error_key).success
      ) {
        navigate({
          to: '/setup/$key',
          params: {
            key: error.error_key,
          },
          search: {
            message: error.message,
            platforms: error.platforms,
          },
          replace: true,
        })
      }

      handleError(error)
      reset()
    },
  })

  return (
    <SetupIncompleteView
      issue={key}
      message={message}
      path={path}
      defaultPath={defaultPath}
      isSetup={is_setup}
      onBack={() => {
        if (is_setup) {
          if (redirect) {
            navigate({
              to: redirect,
              replace: true,
            })
          } else {
            navigate({
              to: '/menu',
              replace: true,
            })
          }
        } else {
          navigate({
            to: '/setup/select',
            replace: true,
          })
        }
      }}
      onRetry={() => {
        mutate({
          key,
          path: undefined,
          platforms,
        })
      }}
      onSelect={async () => {
        const selected = await open({
          filters: [
            {
              name:
                key === 'BattleNetInstall'
                  ? 'Battle.net Launcher'
                  : key === 'BattleNetConfig'
                    ? 'Configuration File'
                    : 'steam',
              extensions: [key.endsWith('Config') ? 'config' : 'exe'],
            },
          ],
          defaultPath: defaultPath || undefined,
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
            closeButton: false,
          })
          return
        }
        mutate({
          key,
          path: selected as string,
          platforms,
        })
      }}
    />
  )
}
