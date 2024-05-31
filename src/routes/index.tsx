import { launchQueryOptions } from '@/lib/data'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: async ({ context: { queryClient } }) => {
    const { is_setup } = await queryClient.fetchQuery(launchQueryOptions)
    if (is_setup) {
      throw redirect({ to: '/menu' })
    }
    throw redirect({ to: '/setup' })
  }
})
