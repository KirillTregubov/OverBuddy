import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { SteamSetupView } from '@/components/SetupViews'
import {
  launchQueryOptions,
  steamQueryOptions,
  useSteamConfirmMutation,
} from '@/lib/data'
import { RedirectSearchParam } from '@/lib/schemas'

export const Route = createFileRoute('/setup/steam_setup')({
  validateSearch: RedirectSearchParam,
  beforeLoad: async ({ context: { queryClient } }) => {
    const { is_setup, steam } = await queryClient.fetchQuery(launchQueryOptions)
    if (!is_setup || !steam.configs) {
      throw redirect({ to: '/' })
    }
  },
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(steamQueryOptions)
  },
  component: SteamSetup,
})

function SteamSetup() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const { data: profiles } = useSuspenseQuery(steamQueryOptions)
  const { mutate, status } = useSteamConfirmMutation({
    onError: () => {
      navigate({
        to: '/setup/NoSteamOverwatch',
        search: {
          redirect,
        },
        replace: true,
      })
    },
    onSuccess: () => {
      if (redirect) {
        navigate({
          to: redirect,
          replace: true,
        })
      } else {
        navigate({
          to: '/menu',
          replace: true,
        })
      }
    },
  })

  return (
    <SteamSetupView
      profiles={profiles}
      status={status}
      onConfirm={() => mutate()}
    />
  )
}
