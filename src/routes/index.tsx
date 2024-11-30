import { createFileRoute, redirect } from '@tanstack/react-router'

import { launchQueryOptions } from '@/lib/data'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup } = await queryClient.fetchQuery(launchQueryOptions)
    if (is_setup) {
      throw redirect({ to: '/menu' })
    } else {
      throw redirect({ to: '/setup' })
    }
  },
  pendingMs: 0
})
