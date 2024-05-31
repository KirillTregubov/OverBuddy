import { queryOptions, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  ConfigError,
  ConfigErrorSchema,
  ConfigErrors,
  SetupError,
  handleError
} from '@/lib/errors'
import { LaunchConfig, type Platform } from '@/lib/schemas'
import { queryClient } from '@/main'

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

export const useSetupMutation = ({
  onError,
  onSuccess
}: {
  onError?: (error: Error | ConfigError) => void
  onSuccess?: (data: LaunchConfig) => void
} = {}) =>
  useMutation({
    mutationFn: async (platforms: Platform[]) => {
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
      })

      const config = LaunchConfig.safeParse(JSON.parse(data as string))
      if (!config.success) {
        throw new Error(config.error.message)
      }
      if (!config.data.is_setup) {
        throw new SetupError()
      }

      queryClient.setQueryData(['launch'], config.data)
      return config.data
    },
    onError,
    onSuccess
  })

export const getSetupPath = (key: ConfigErrors) =>
  queryOptions({
    queryKey: ['directory', key],
    queryFn: async () => {
      try {
        return (await invoke('get_setup_path', { key })) as string
      } catch (error) {
        handleError(error)
      }
      throw new Error('Failed to get directory')
    }
  })

export const useSetupErrorMutation = ({
  onError,
  onSuccess
}: {
  onError?: (error: Error | ConfigError) => void
  onSuccess?: (data: LaunchConfig) => void
} = {}) =>
  useMutation({
    mutationFn: async ({
      key,
      path,
      platforms
    }: {
      key: ConfigErrorSchema['error_key']
      path: string
      platforms: Platform[]
    }) => {
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
      })

      const config = LaunchConfig.safeParse(JSON.parse(data as string))
      if (!config.success) {
        throw new Error(`Failed to setup. ${config.error.message}`)
      }

      queryClient.setQueryData(['launch'], config.data)
      return config.data
    },
    onError,
    onSuccess
  })

export const Background = z.object({
  id: z.string(),
  image: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string())
})
export type Background = z.infer<typeof Background>

export const BackgroundArray = z.array(Background)
export type BackgroundArray = z.infer<typeof BackgroundArray>

export const backgroundsQueryOptions = queryOptions({
  queryKey: ['backgrounds'],
  queryFn: async () => {
    const data = await invoke('get_backgrounds')
    const backgrounds = BackgroundArray.safeParse(JSON.parse(data as string))
    if (!backgrounds.success) {
      throw new Error(`Failed to get backgrounds. ${backgrounds.error.message}`)
    }
    // preload images
    backgrounds.data.forEach((background) => {
      const img = new Image()
      img.src = `/backgrounds/${background.image}`
    })
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
      handleError(error)
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
      toast.success('Reset to default background.')
      onSuccess?.()
    },
    onSettled
  })

export const useResetMutation = ({
  onSuccess,
  onSettled
}: {
  onSuccess?: () => void
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
    onError: (error) => handleError(error),
    onSuccess: () => {
      toast.success('Reset to default settings.')
      onSuccess?.()
    },
    onSettled
  })
