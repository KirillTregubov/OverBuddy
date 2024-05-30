import { z } from 'zod'

export const Platform = z.enum(['BattleNet', 'Steam'])
export type Platform = z.infer<typeof Platform>

export const LaunchConfig = z.object({
  is_setup: z.boolean(),
  battle_net: z.object({
    enabled: z.boolean(),
    config: z.string().nullable(),
    install: z.string().nullable()
  }),
  steam: z.object({
    enabled: z.boolean(),
    config: z.string().nullable(),
    install: z.string().nullable()
  }),
  background: z.object({
    current: z.string().nullable()
  })
})
export type LaunchConfig = z.infer<typeof LaunchConfig>
