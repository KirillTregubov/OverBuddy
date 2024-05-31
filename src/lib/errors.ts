import { toast } from 'sonner'
import { z } from 'zod'

import { Platform } from '@/lib/schemas'

/* ConfigErrors */
export const ConfigErrors = z.enum([
  'BattleNetConfig',
  'BattleNetInstall',
  'SteamInstall'
])
export type ConfigErrors = z.infer<typeof ConfigErrors>

/* ConfigError Response Schema */
export const ConfigErrorSchema = z.object({
  error_key: ConfigErrors.or(z.enum(['NoOverwatch'])),
  message: z.string(),
  error_action: z.string().nullable(),
  platforms: z.array(Platform)
})
export type ConfigErrorSchema = z.infer<typeof ConfigErrorSchema>

/* ConfigError Class */
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

/* SetupError Class */
export class SetupError extends Error {
  constructor() {
    super('Failed to setup!')
  }
}

/* Handle non-critical errors */
export function handleError(error: unknown, reportable = true) {
  if (error instanceof Error) error = error.message
  else if (typeof error !== 'string') error = 'An unknown error occurred.'
  toast.error((error as string).replaceAll(/\[\[|\]\]/g, '"'), {
    action: reportable
      ? {
          label: 'Report',
          onClick: () => toast.dismiss() // TODO: Implement error reporting
        }
      : undefined
  })
}
