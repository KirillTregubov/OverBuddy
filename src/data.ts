import { queryOptions, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import { z } from 'zod'

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
