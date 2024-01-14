import { queryOptions, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { z } from 'zod'

export const LaunchConfig = z.object({
  is_setup: z.boolean(),
  config: z.string().nullable()
})
export type LaunchConfig = z.infer<typeof LaunchConfig>

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

export const Background = z.object({
  id: z.string(),
  image: z.string(),
  name: z.string()
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

export const useBackgroundsMutation = () =>
  useMutation({
    mutationFn: (background: { id: string }) => {
      return invoke('set_background', background)
    },
    onError: (error) => {
      console.error(error)
    }
  })
