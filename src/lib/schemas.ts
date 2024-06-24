import { z } from 'zod'

export const Platform = z.enum(['BattleNet', 'Steam'])
export type Platform = z.infer<typeof Platform>

const SteamConfig = z.object({
  id: z.string(),
  file: z.string()
})

export const SteamProfile = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().url()
})
export type SteamProfile = z.infer<typeof SteamProfile>

export const LaunchConfig = z.object({
  is_setup: z.boolean(),
  battle_net: z.object({
    enabled: z.boolean(),
    config: z.string().nullable(),
    install: z.string().nullable()
  }),
  steam: z.object({
    enabled: z.boolean(),
    setup: z.boolean(),
    profiles: z.array(SteamProfile).nullable(),
    install: z.string().nullable(),
    configs: z.array(SteamConfig).nullable()
  }),
  background: z.object({
    current: z.string().nullable(),
    is_outdated: z.boolean()
  })
})
export type LaunchConfig = z.infer<typeof LaunchConfig>

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

export const Settings = z.object({
  platforms: z.array(Platform),
  steamProfiles: z.array(SteamProfile).nullable()
})
export type Settings = z.infer<typeof Settings>
