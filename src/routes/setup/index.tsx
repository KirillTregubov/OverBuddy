import { createFileRoute } from '@tanstack/react-router'

import { SetupSplashView } from '@/components/SetupViews'
import { updateQueryOptions } from '@/lib/data'

export const Route = createFileRoute('/setup/')({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(updateQueryOptions(true)),
  component: SetupSplash,
})

function SetupSplash() {
  return <SetupSplashView />
}
