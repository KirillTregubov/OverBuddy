import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { SetupSelectView } from '@/components/SetupViews'
import { useSetupMutation } from '@/lib/data'
import {
  ConfigError,
  ConfigErrors,
  SetupError,
  handleError,
} from '@/lib/errors'
import { Platform } from '@/lib/schemas'

export const Route = createFileRoute('/setup/select')({
  component: SetupSelect,
})

function SetupSelect() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const navigate = useNavigate()
  const { status, mutate, reset } = useSetupMutation({
    onError: (error) => {
      if (error instanceof SetupError) {
        handleError(error)
        reset()
      } else if (
        error instanceof ConfigError &&
        ConfigErrors.safeParse(error.error_key).success
      ) {
        navigate({
          to: '/setup/$key',
          params: {
            key: error.error_key,
          },
          search: {
            message: error.message,
            platforms: error.platforms,
          },
          replace: true,
        })
        return
      }
    },
    onSuccess: () => {
      navigate({
        to: '/menu',
        replace: true,
      })
    },
  })

  return (
    <SetupSelectView
      platforms={platforms}
      status={status}
      onTogglePlatform={(platform) => {
        if (platforms.includes(platform)) {
          setPlatforms(platforms.filter((p) => p !== platform))
          return
        }
        setPlatforms([...platforms, platform])
      }}
      onContinue={() => {
        if (platforms.length === 0) {
          toast.warning('You must select at least one platform.', {
            id: 'select-at-least-one',
          })
          return
        }
        mutate({ platforms })
      }}
    />
  )
}
