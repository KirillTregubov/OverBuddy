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
  SteamSetupError,
  handleError
} from '@/lib/errors'
import {
  Background,
  BackgroundArray,
  LaunchConfig,
  SteamProfile,
  type Platform
} from '@/lib/schemas'
import { queryClient } from '@/main'
import { useState } from 'react'
import { isDev } from './dev'

const launchQueryKey = ['launch']

const updateLaunchConfig = async (config: LaunchConfig) => {
  queryClient.setQueryData(launchQueryKey, config)
}

export const launchQueryOptions = queryOptions({
  queryKey: launchQueryKey,
  queryFn: async () => {
    const data = await invoke('get_launch_config').catch((error) => {
      if (typeof error !== 'string') throw error
      throw new Error(error)
    })
    const config = LaunchConfig.safeParse(JSON.parse(data as string))
    if (!config.success) {
      throw new Error(config.error.message)
    }

    updateLaunchConfig(config.data)

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
  onSuccess,
  throwOnError = true
}: {
  isInitialized?: boolean
  onError?: (error: Error | ConfigError) => void
  onSuccess?: (data: SetupResponse) => void
  throwOnError?: boolean
} = {}) =>
  useMutation({
    mutationFn: setupMutation,
    onError,
    onSuccess,
    throwOnError
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
  onError,
  onSuccess
}: {
  onError?: (err: Error) => void
  onSuccess?: () => void
} = {}) =>
  useMutation({
    mutationFn: async () => {
      let data = (await invoke('confirm_steam_setup')) as string

      if (data.startsWith('NoSteamOverwatch')) {
        if (data.includes('Fatal')) {
          throw new SteamSetupError()
        } else {
          data = (await invoke('undo_steam_setup')) as string
          toast.warning(
            'Cannot enable Steam support: No Overwatch installation found.',
            {
              id: 'no-steam-overwatch'
            }
          )
        }
      }

      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(
          `Failed to save background change. ${config.error.message}`
        )
      }
      updateLaunchConfig(config.data)
    },
    onError: (error) => {
      if (error instanceof SteamSetupError) {
        onError?.(error)
        return
      }

      handleError(error)
    },
    onSuccess
  })

export const useSteamUndoMutation = ({
  onSuccess
}: {
  onSuccess?: () => void
} = {}) =>
  useMutation({
    mutationFn: async () => {
      const data = (await invoke('undo_steam_setup')) as string
      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(
          `Failed to save background change. ${config.error.message}`
        )
      }
      updateLaunchConfig(config.data)
    },
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

/**
 * Query for the active background
 *
 * Preconditions:
 * - Launch config must be loaded
 * - Backgrounds must be loaded
 * - Backgrounds is not empty
 */
export const activeBackgroundQueryOptions = queryOptions({
  queryKey: ['active_background'],
  queryFn: async () => {
    await queryClient.ensureQueryData(launchQueryOptions)
    await queryClient.ensureQueryData(backgroundsQueryOptions)

    const backgrounds = queryClient.getQueryData(
      backgroundsQueryOptions.queryKey
    )!
    const defaultBackground = backgrounds[0]!
    const current = queryClient.getQueryData(launchQueryOptions.queryKey)!
      .shared.background.current
    if (current !== null) {
      const index = backgrounds.findIndex((bg) => bg.id === current)
      if (index === -1) return defaultBackground
      return backgrounds[index]!
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

export const backgroundToastIds = ['background-1', 'background-2']
export const useBackgroundMutation = ({
  onError
}: {
  onError?: (error: Error) => void
} = {}) => {
  const [toastIndex, setToastIndex] = useState(0)

  return useMutation({
    mutationFn: async (background: { id: string; isCustom?: boolean }) => {
      const data = (await invoke('set_background', background)) as string
      const config = LaunchConfig.safeParse(JSON.parse(data))
      if (!config.success) {
        throw new Error(
          `Failed to save background change. ${config.error.message}`
        )
      }
      updateLaunchConfig(config.data)

      return {
        background: background.id,
        isCustom: background.isCustom
      }
    },
    onSuccess: (data) => {
      toast.dismiss('reset-background')
      toast.dismiss(backgroundToastIds[toastIndex])
      const newIndex = (toastIndex + 1) % backgroundToastIds.length

      // TODO: Check https://github.com/emilkowalski/sonner/issues/592 before updating Sonner
      // setTimeout(() => {
      if (data.isCustom) {
        toast.success(
          `Successfully applied custom background ${data.background}.`,
          { id: backgroundToastIds[newIndex], duration: 8000 }
        )
      } else {
        toast.success(`Successfully applied background.`, {
          id: backgroundToastIds[newIndex]
        })
      }
      // }, 100)

      setToastIndex(newIndex)
    },
    onError: (error) => {
      onError?.(error)
    }
  })
}

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
      backgroundToastIds.forEach((id) => toast.dismiss(id))
      toast.success('Successfully reverted to the default background.', {
        id: 'reset-background'
      })
      onSuccess?.()
    },
    onSettled
  })

export const useDebugConsoleMutation = () =>
  useMutation({
    mutationFn: async (data: { enableConsole: boolean }) => {
      const query = (await invoke('set_debug_console', data)) as string
      const config = LaunchConfig.safeParse(JSON.parse(query))
      if (!config.success) {
        throw new Error(
          `Failed to save debug console change. ${config.error.message}`
        )
      }
      updateLaunchConfig(config.data)
      return data.enableConsole
    },
    onError: (error) => handleError(error),
    onSuccess: (enableConsole) => {
      const id = enableConsole ? 'debug-console' : 'debug-console-disabled'
      const prevId = !enableConsole ? 'debug-console' : 'debug-console-disabled'
      toast.dismiss(prevId)
      if (enableConsole) {
        toast.success('The Overwatch debug console has been enabled.', {
          id: id
        })
      } else {
        toast.warning('The Overwatch debug console has been disabled.', {
          id: id
        })
      }
    }
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
      invalidateActiveBackground()
      updateLaunchConfig(config.data)
    },
    onError: (error) => {
      handleError(error)
      onError?.(error)
    },
    onSuccess: () => {
      toast.success('All settings have been reset to default.')
      onSuccess?.()
    },
    onSettled
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
  // if (isDev()) {
  //   return {
  //     available: false
  //   } satisfies useCheckUpdatesReturnType
  // }

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

export const shouldAdvertiseQueryOptions = queryOptions({
  queryKey: ['advertisement'],
  queryFn: () => true,
  staleTime: Infinity
})

export const useDismissAdMutation = () =>
  useMutation({
    mutationFn: async () => {
      queryClient.setQueryData(shouldAdvertiseQueryOptions.queryKey, false)
    }
  })
