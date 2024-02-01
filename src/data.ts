import { queryOptions, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { toast } from 'sonner'
import { z } from 'zod'

const handleError = (error: unknown) => {
  if (error instanceof Error) error = error.message
  if (typeof error !== 'string') error = 'An unknown error occurred.'
  toast.error(error as string)
}

const LaunchConfig = z.object({
  is_setup: z.boolean(),
  battle_net: z.object({
    enabled: z.boolean(),
    config: z.string().nullable(),
    install: z.string().nullable()
  }),
  steam: z.object({
    enabled: z.boolean(),
    // config: z.string().nullable(),
    install: z.string().nullable()
  })
  // battle_net_config: z.string().nullable(),
  // battle_net_install: z.string().nullable()
})
type LaunchConfig = z.infer<typeof LaunchConfig>

export const launchQueryOptions = queryOptions({
  queryKey: ['launch'],
  queryFn: async () => {
    const data = await invoke('get_launch_config')
    const config = LaunchConfig.safeParse(JSON.parse(data as string))
    if (!config.success) {
      throw new Error(config.error.message)
    }
    return config.data
  }
})

const Platform = z.enum(['BattleNet', 'Steam'])
export type Platform = z.infer<typeof Platform>

export const ConfigErrors = z.enum([
  'BattleNetConfig',
  'BattleNetInstall',
  'SteamInstall'
])
export type ConfigErrors = z.infer<typeof ConfigErrors>

const ConfigErrorSchema = z.object({
  error_key: ConfigErrors.or(z.enum(['NoOverwatch'])),
  message: z.string(),
  error_action: z.string().nullable(),
  platforms: z.array(Platform)
})
export type ConfigErrorSchema = z.infer<typeof ConfigErrorSchema>

export class ConfigError extends Error {
  error_key: ConfigErrorSchema['error_key']
  error_action: ConfigErrorSchema['error_action']
  platforms: ConfigErrorSchema['platforms']

  constructor(public error: ConfigErrorSchema) {
    super(error.message)
    this.error_key = error.error_key
    this.error_action = error.error_action
    this.platforms = error.platforms
  }
}

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
        throw new Error('Setup failed')
      }
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
        throw new Error(config.error.message)
      }
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
      throw new Error(backgrounds.error.message)
    }
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
      return (await invoke('set_background', background)) as void
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
      return (await invoke('reset_background')) as void
    },
    onError: (error) => handleError(error),
    onSuccess: () => {
      toast.success('Reset to default background.')
      onSuccess?.()
    },
    onSettled
  })
