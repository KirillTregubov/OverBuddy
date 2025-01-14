import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { Button, LinkButton } from '@/components/Button'
import ErrorWrapper from '@/components/ErrorWrapper'
import { useSteamUndoMutation } from '@/lib/data'

export const Route = createFileRoute('/setup/NoSteamOverwatch')({
  validateSearch: z.object({
    redirect: z.string().optional()
  }),
  staleTime: Infinity,
  component: ConfigureComponent
})

function ConfigureComponent() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()

  const { mutate, status } = useSteamUndoMutation({
    onSuccess: () => {
      navigate({
        to: '/setup/select',
        replace: true
      })
    }
  })

  return (
    <ErrorWrapper
      title="Cannot Complete Setup"
      description={
        <>
          <p className="mb-2 leading-7">
            No Overwatch installations were found on Steam.
          </p>
          <p className="leading-7">
            Please install Overwatch on Steam and try again. If you&apos;d like
            to use Battle.net instead, <br />
            restart the setup process and select it.
          </p>
        </>
      }
      buttons={
        <>
          <LinkButton to="/setup/steam_setup" replace search={{ redirect }}>
            Go Back
          </LinkButton>
          <Button primary onClick={mutate} disabled={status !== 'idle'}>
            Restart Setup
          </Button>
        </>
      }
    />
  )
}
