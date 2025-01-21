import { z } from 'zod'

export const Platform = z.enum(['BattleNet', 'Steam'])
export type Platform = z.infer<typeof Platform>

const SteamLocalconfig = z.object({
  id: z.string(),
  file: z.string()
})

export const SteamProfile = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().url().nullable(),
  has_overwatch: z.boolean()
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
    in_setup: z.boolean(),
    advertised: z.number(),
    install: z.string().nullable(),
    configs: z.array(SteamLocalconfig).nullable(),
    profiles: z.array(SteamProfile).nullable()
  }),
  shared: z.object({
    background: z.object({
      current: z.string().nullable(),
      is_outdated: z.boolean()
    }),
    additional: z.object({
      console_enabled: z.boolean()
    })
  })
})
export type LaunchConfig = z.infer<typeof LaunchConfig>

export const Background = z.object({
  id: z.string(),
  image: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  new: z.boolean()
})
export type Background = z.infer<typeof Background>

export const BackgroundArray = z.array(Background)
export type BackgroundArray = z.infer<typeof BackgroundArray>

export const SettingsData = z.object({
  platforms: z.array(Platform),
  steam_profiles: z.array(SteamProfile).nullable()
})
export type SettingsData = z.infer<typeof SettingsData>
