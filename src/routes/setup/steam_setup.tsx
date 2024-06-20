import { createFileRoute, redirect } from '@tanstack/react-router'

import { launchQueryOptions } from '@/lib/data'

export const Route = createFileRoute('/setup/steam_setup')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient.fetchQuery(launchQueryOptions)
    if (!is_setup || !steam.available_configs) {
      throw redirect({ to: '/' })
    }
  },
  // TODO: choose steam profiles
  component: () => <div>Hello /setup/steam_setup!</div>
})
