import {
  ErrorComponent,
  ErrorRouteProps,
  Outlet,
  redirect,
  rootRouteWithContext
} from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api'
import { Toaster } from 'sonner'

import { launchQueryOptions } from '../data'

export const Route = rootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    if (location.pathname !== '/') {
      return
    }
    const { is_setup } = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch((error) => {
        if (typeof error === 'string') {
          error = Error(error)
        }
        throw error
      })
    if (!is_setup) {
      throw redirect({ to: '/setup' })
    } else {
      throw redirect({ to: '/menu' })
    }
  },
  errorComponent: RootErrorComponent as any,
  component: RootComponent
})

function RootErrorComponent({ error }: ErrorRouteProps) {
  if (typeof error === 'string') {
    error = Error(error)
  }

  return <ErrorComponent error={error} />
}

function RootComponent() {
  useEffect(() => {
    invoke('mounted')
  }, [])

  return (
    <div className="h-screen max-h-screen">
      <Outlet />
      <Toaster
        position="bottom-left"
        richColors
        toastOptions={{
          classNames: {
            toast: 'select-none'
          }
        }}
      />
    </div>
  )
}
