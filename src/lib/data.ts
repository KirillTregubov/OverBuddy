import { queryOptions, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  ConfigError,
  ConfigErrorSchema,
  ConfigErrors,
  SetupError,
  SetupPathResponse,
  handleError
} from '@/lib/errors'
import {
  BackgroundArray,
  LaunchConfig,
  Settings,
  SteamProfile,
  type Platform
} from '@/lib/schemas'
import { queryClient } from '@/main'
import { emit } from '@tauri-apps/api/event'

export const launchQueryOptions = queryOptions({
  queryKey: ['launch'],
  queryFn: async () => {
    const data = await invoke('get_launch_config').catch((error) => {
      if (typeof error !== 'string') throw error
      throw new Error(error)
    })
    const config = LaunchConfig.safeParse(JSON.parse(data as string))
    if (!config.success) {
      throw new Error(config.error.message)
    }
    return config.data
  },
  staleTime: Infinity
})

type SetupResponse = {
  platforms: Platform[]
  config: LaunchConfig
}

const setupMutation = async (platforms: Platform[]): Promise<SetupResponse> => {
  const data = await invoke('setup', { platforms }).catch((error) => {
    if (typeof error !== 'string') throw error

    let parsed
    try {
      parsed = JSON.parse(error as string)
    } catch (_) {
      throw new Error(error)
    }

    const configError = ConfigErrorSchema.safeParse(parsed)
    if (configError.success) {
      throw new ConfigError(configError.data)
    }

    throw new Error(configError.error.message)
  })

  const config = LaunchConfig.safeParse(JSON.parse(data as string))
  if (!config.success) {
    throw new Error(config.error.message)
  }
  if (!config.data.is_setup) {
    throw new SetupError()
  }

  queryClient.setQueryData(['launch'], config.data)
  return { platforms, config: config.data }
}

export const useSetupMutation = ({
  onError,
  onSuccess
}: {
  onError?: (error: Error | ConfigError) => void
  onSuccess?: (data: SetupResponse) => void
} = {}) =>
  useMutation({
    mutationFn: setupMutation,
    onError,
    onSuccess
  })

export const getSetupPath = (key: ConfigErrors) =>
  queryOptions({
    queryKey: ['setup_path', key],
    queryFn: async () => {
      try {
        const data = await invoke('get_setup_path', { key })
        const setupPath = SetupPathResponse.safeParse(
          JSON.parse(data as string)
        )
        if (!setupPath.success) {
          throw new Error(setupPath.error.message)
        }
        return setupPath.data
      } catch (error) {
        handleError(error)

        if (typeof error === 'string') throw new Error(error)
      }
      throw new Error('Failed to get setup paths.')
    }
  })

export const useSetupErrorMutation = ({
  onError,
  onSuccess
}: {
  onError?: (error: Error | ConfigError) => void
  onSuccess?: (data: SetupResponse) => void
} = {}) =>
  useMutation({
    mutationFn: async ({
      key,
      path,
      platforms
    }: {
      key: ConfigErrorSchema['error_key']
      path: string | undefined
      platforms: Platform[]
    }) => {
      if (!path && key === 'SteamAccount') {
        return setupMutation(platforms)
      } else if (!path) {
        throw new Error(`Invalid path for key ${key}`)
      }

      const data = await invoke('resolve_setup_error', {
        key,
        path,
        platforms
      }).catch((error) => {
        if (typeof error !== 'string') throw error

        let parsed
        try {
          parsed = JSON.parse(error as string)
        } catch (_) {
          throw new Error(error)
        }

        const configError = ConfigErrorSchema.safeParse(parsed)
        if (configError.success) {
          throw new ConfigError(configError.data)
        }

        throw new Error(configError.error.message)
      })

      const config = LaunchConfig.safeParse(JSON.parse(data as string))
      if (!config.success) {
        throw new Error(`Failed to setup. ${config.error.message}`)
      }

      queryClient.setQueryData(['launch'], config.data)
      return { platforms, config: config.data }
    },
    onError,
    onSuccess
  })

export const steamQueryOptions = queryOptions({
  queryKey: ['steam'],
  queryFn: async () => {
    const data = await invoke('get_steam_accounts')
    const accounts = z.array(SteamProfile).safeParse(JSON.parse(data as string))
    if (!accounts.success) {
      throw new Error(`Failed to get Steam accounts. ${accounts.error.message}`)
    }

    console.log(accounts.data)
    return accounts.data as SteamProfile[]
  }
})

export const useSteamConfirmMutation = ({
  onSuccess
}: {
  onSuccess?: () => void
} = {}) =>
  useMutation({
    mutationFn: async () => {
      const data = (await invoke('confirm_steam_setup')) as string
      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(
          `Failed to save background change. ${config.error.message}`
        )
      }
      queryClient.setQueryData(['launch'], config.data)
    },
    onError: (error) => handleError(error),
    onSuccess
  })

export const backgroundsQueryOptions = queryOptions({
  queryKey: ['backgrounds'],
  queryFn: async () => {
    const data = await invoke('get_backgrounds')
    const backgrounds = BackgroundArray.safeParse(JSON.parse(data as string))
    if (!backgrounds.success) {
      throw new Error(`Failed to get backgrounds. ${backgrounds.error.message}`)
    }

    // Preload images
    await Promise.allSettled(
      backgrounds.data.map(
        (background) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => reject()
            img.src = `/backgrounds/${background.image}`
          })
      )
    )

    return backgrounds.data
  }
})

export const useBackgroundMutation = ({
  onError
}: {
  onError?: (error: Error) => void
} = {}) =>
  useMutation({
    mutationFn: async (background: { id: string }) => {
      const data = (await invoke('set_background', background)) as string
      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(
          `Failed to save background change. ${config.error.message}`
        )
      }
      queryClient.setQueryData(['launch'], config.data)
    },
    onError: (error) => {
      onError?.(error)
    }
  })

export const useResetBackgroundMutation = ({
  onSuccess,
  onSettled
}: {
  onSuccess?: () => void
  onSettled?: () => void
} = {}) =>
  useMutation({
    mutationFn: async () => {
      const data = (await invoke('reset_background')) as string
      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(`Failed to reset background. ${config.error.message}`)
      }
      queryClient.setQueryData(['launch'], config.data)
    },
    onError: (error) => handleError(error),
    onSuccess: () => {
      toast.success('Successfully reset to default background.')
      onSuccess?.()
    },
    onSettled
  })

export const useResetMutation = ({
  onSuccess,
  onError,
  onSettled
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onSettled?: () => void
} = {}) =>
  useMutation({
    mutationFn: async () => {
      const data = (await invoke('reset')) as string
      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(`Failed to reset.`)
      }
      queryClient.setQueryData(['launch'], config.data)
    },
    onError: (error) => {
      handleError(error)
      onError?.(error)
    },
    onSuccess: () => {
      toast.success('Successfully reset to default settings.')
      onSuccess?.()
    },
    onSettled
  })

export const settingsQueryOptions = queryOptions({
  queryKey: ['settings'],
  queryFn: async () => {
    const data = JSON.stringify({
      platforms: ['Steam'],
      steamProfiles: [
        {
          id: '1121757682',
          name: 'Aimless Russian',
          avatar:
            'https://avatars.akamai.steamstatic.com/141b0b20bef5f40f8e4c85f74e551d9b588bb334_full.jpg'
        },
        {
          id: '171934192',
          name: 'assist delivery',
          avatar:
            'https://avatars.akamai.steamstatic.com/0ebd2c813afc992309612b5973b0dfec761303d7_full.jpg'
        },
        {
          id: '332752569',
          name: 'Spectra',
          avatar:
            'https://avatars.akamai.steamstatic.com/a8091fa7e1c73cf1289ef49f74e105e0c0f5562f_full.jpg'
        }
        // ,
        // {
        //   id: '3327525691',
        //   name: 'Spectra',
        //   avatar:
        //     'https://avatars.akamai.steamstatic.com/a8091fa7e1c73cf1289ef49f74e105e0c0f5562f_full.jpg'
        // },
        // {
        //   id: '3327525693',
        //   name: 'cq6WyuAOdyN8zHgdQxETtAHJrsqWmuns',
        //   avatar:
        //     'https://avatars.akamai.steamstatic.com/a8091fa7e1c73cf1289ef49f74e105e0c0f5562f_full.jpg'
        // }
      ]
    })
    // const data = await invoke('get_settings')

    const settings = Settings.safeParse(JSON.parse(data as string))
    if (!settings.success) {
      throw new Error(`Failed to get settings. ${settings.error.message}`)
    }
    return settings.data
  }
})

export const useUpdateMutation = ({
  onSuccess
}: {
  onSuccess?: () => void
} = {}) =>
  useMutation({
    mutationFn: async () => {
      await emit('tauri://update')
    },
    onError: (error) => {
      handleError(error)
    },
    onSuccess: () => {
      onSuccess?.()
    }
  })
