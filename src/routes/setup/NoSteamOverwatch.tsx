import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { NoSteamOverwatchView } from '@/components/SetupViews'
import { useSteamUndoMutation } from '@/lib/data'
import { RedirectSearchParam } from '@/lib/schemas'

export const Route = createFileRoute('/setup/NoSteamOverwatch')({
  validateSearch: RedirectSearchParam,
  staleTime: Infinity,
  component: ConfigureComponent,
})

function ConfigureComponent() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()

  const { mutate, status } = useSteamUndoMutation({
    onSuccess: () => {
      navigate({
        to: '/setup/select',
        replace: true,
      })
    },
  })

  return (
    <NoSteamOverwatchView
      onBack={() => {
        navigate({
          to: '/setup/steam_setup',
          search: { redirect },
          replace: true,
        })
      }}
      onRestart={() => {
        if (status === 'idle') mutate()
      }}
    />
  )
}
