import { toast } from 'sonner'
import { z } from 'zod'

import { mode } from '@/lib/dev'
import { Platform } from '@/lib/schemas'

/* ConfigErrors */
export const ConfigErrors = z.enum([
  'BattleNetConfig',
  'BattleNetInstall',
  'SteamInstall',
  'SteamAccount'
])
export type ConfigErrors = z.infer<typeof ConfigErrors>

/* ConfigError Response Schema */
export const ConfigErrorSchema = z.object({
  error_key: ConfigErrors.or(z.enum(['NoOverwatch'])),
  message: z.string(),
  platforms: z.array(Platform)
})
export type ConfigErrorSchema = z.infer<typeof ConfigErrorSchema>

/* ConfigError Class */
export class ConfigError extends Error {
  error_key: ConfigErrorSchema['error_key']
  platforms: ConfigErrorSchema['platforms']

  constructor(public error: ConfigErrorSchema) {
    super(error.message)
    this.error_key = error.error_key
    this.platforms = error.platforms
  }
}

/* SetupError Class */
export class SetupError extends Error {
  constructor() {
    super('Encountered an error during setup.')
  }
}

export const SetupPathResponse = z.object({
  path: z.string().nullable(),
  defaultPath: z.string().nullable()
})
export type SetupPathResponse = z.infer<typeof SetupPathResponse>

/* SteamSetupError Class */
export class SteamSetupError extends Error {
  constructor() {
    super('Failed to find a Steam installation of Overwatch.')
  }
}

/* Handle non-critical errors */
// , reportable = true
export function handleError(error: unknown) {
  if (error instanceof Error) error = error.message
  else if (typeof error !== 'string') error = 'An unknown error occurred.'
  toast.error(
    (error as string).replaceAll(/\[\[|\]\]/g, '"') +
      (/[.!?]$/.test(error as string) ? '' : '.'),
    {
      classNames: {
        toast: '!max-w-[28rem] !select-auto'
      }
    }
  )
  // , {
  //   action: reportable
  //     ? {
  //         label: 'Report',
  //         onClick: () => toast.dismiss() // TODO: Implement error reporting
  //       }
  //     : undefined
  // }
}

// TODO: Add react query and rust function information
export function getReportURL(error: Error) {
  const formattedError = error.message.replaceAll(/\[\[|\]\]/g, '"')
  const body = encodeURIComponent(
    `**Encountered Error**\n\`\`\`${formattedError}\`\`\`\n\n**Describe your issue**\n\n<!--Please describe how you ran into this issue and leave any other comments.-->\n\n\n**App Context:**\n**OverBuddy Version:** \`\`\`Version ${import.meta.env.PACKAGE_VERSION} (${mode})\`\`\`\n**Route:** \`\`\`${window.location.pathname}\`\`\``
  )
  return `https://github.com/KirillTregubov/OverBuddy/issues/new?body=${body}`
}
