import { queryOptions, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { check } from '@tauri-apps/plugin-updater'
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
  Background,
  BackgroundArray,
  LaunchConfig,
  SettingsData,
  SteamProfile,
  type Platform
} from '@/lib/schemas'
import { queryClient } from '@/main'
import { isDev } from './dev'

const updateLaunchConfig = async (
  config: LaunchConfig,
  setLaunchQuery = true
) => {
  const settingsData = {} as SettingsData
  settingsData.platforms = [
    config.steam.enabled && ('Steam' as const),
    config.battle_net.enabled && ('BattleNet' as const)
  ].filter(Boolean)
  if (config.steam.enabled && config.steam.setup) {
    settingsData.steam_profiles = config.steam.profiles
  }
  queryClient.setQueryData(['settings'], settingsData)
  queryClient.invalidateQueries({ queryKey: ['settings'] })

  if (setLaunchQuery) {
    queryClient.setQueryData(['launch'], config)
  }
}

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

    updateLaunchConfig(config.data, false)

    return config.data
  },
  staleTime: Infinity
})

type SetupResponse = {
  platforms: Platform[]
  config: LaunchConfig
}

const setupMutation = async ({
  platforms,
  isInitialized = false
}: {
  platforms: Platform[]
  isInitialized?: boolean
}): Promise<SetupResponse> => {
  const data = await invoke('setup', { platforms, isInitialized }).catch(
    (error) => {
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

      throw new Error(
        `Failed to setup. Received: [[${JSON.stringify(parsed)}]], Error: [[${configError.error.message}]]`
      )
    }
  )

  const config = LaunchConfig.safeParse(JSON.parse(data as string))
  if (!config.success) {
    throw new Error(config.error.message)
  }
  updateLaunchConfig(config.data)

  if (!config.data.is_setup) {
    throw new SetupError()
  }

  return { platforms, config: config.data }
}

export const useSetupMutation = ({
  onError,
  onSuccess
}: {
  isInitialized?: boolean
  onError?: (error: Error | ConfigError) => void
  onSuccess?: (data: SetupResponse) => void
  throwOnError?: boolean
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
        return setupMutation({ platforms })
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

      updateLaunchConfig(config.data)
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
    return accounts.data satisfies SteamProfile[]
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
      updateLaunchConfig(config.data)
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
  },
  staleTime: isDev() ? 0 : Infinity
})

export const activeBackgroundQueryOptions = queryOptions({
  queryKey: ['active_background'],
  queryFn: async () => {
    await queryClient.ensureQueryData(backgroundsQueryOptions)
    await queryClient.ensureQueryData(launchQueryOptions)

    const backgrounds = queryClient.getQueryData(
      backgroundsQueryOptions.queryKey
    )!
    const defaultBackground = backgrounds[0]
    const current = queryClient.getQueryData(launchQueryOptions.queryKey)!
      .background.current
    if (current !== null) {
      const index = backgrounds.findIndex((bg) => bg.id === current)
      if (index === -1) return defaultBackground
      return backgrounds[index]
    }

    return defaultBackground
  },
  staleTime: Infinity
})

export const useActiveBackgroundMutation = () =>
  useMutation({
    mutationFn: async (background: Background) => {
      queryClient.setQueryData(
        activeBackgroundQueryOptions.queryKey,
        background
      )
      return
    }
  })

export const invalidateActiveBackground = () =>
  queryClient.invalidateQueries(activeBackgroundQueryOptions)

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
      updateLaunchConfig(config.data)
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
      updateLaunchConfig(config.data)
    },
    onError: (error) => handleError(error),
    onSuccess: () => {
      toast.success('Successfully reverted to the default background.')
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
      queryClient.invalidateQueries({ queryKey: ['active_background'] })
      updateLaunchConfig(config.data)
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
    const data = await invoke('get_settings_data')
    const settings = SettingsData.safeParse(JSON.parse(data as string))
    if (!settings.success) {
      throw new Error(`Failed to get settings. ${settings.error.message}`)
    }
    return settings.data
  },
  staleTime: 0
})

type useCheckUpdatesReturnType =
  | { available: false }
  | {
      available: boolean
      version: string
      body: string | undefined
    }
  | undefined

const checkUpdate = async () => {
  const update = await check()
  if (isDev()) {
    return {
      available: false
    } satisfies useCheckUpdatesReturnType
  }

  if (update) {
    return {
      available: update.available,
      version: update.version,
      body: update.body
    } satisfies useCheckUpdatesReturnType
  }

  return {
    available: false
  } satisfies useCheckUpdatesReturnType
}

export const useCheckUpdates = ({
  onSuccess
}: {
  onSuccess?: (data?: useCheckUpdatesReturnType) => void
} = {}) =>
  useMutation({
    mutationFn: checkUpdate,
    onError: (error) => {
      handleError(error)
    },
    onSuccess: (data) => onSuccess?.(data)
  })

export const useUpdateMutation = ({
  onSuccess
}: {
  onSuccess?: (data: boolean) => void
} = {}) =>
  useMutation({
    mutationFn: async (
      onProgress: (progress: number | ((prevState: number) => number)) => void
    ) => {
      const update = await check()
      if (!update || !update.available) {
        return false
      }

      let downloaded = 0
      let contentLength = 0
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength!
            onProgress(0)
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            onProgress((downloaded / contentLength) * 100)
            break
          case 'Finished':
            onProgress(100)
            break
        }
      })

      return true
    },
    onError: (error) => {
      handleError(error)
    },
    onSuccess: (data) => onSuccess?.(data)
  })

export const updateQueryOptions = (enabled: boolean = false) =>
  queryOptions({
    queryKey: ['check_for_update'],
    queryFn: checkUpdate,
    enabled
  })
