import { QueryClient } from '@tanstack/react-query'
import {
  ErrorComponent,
  ErrorComponentProps,
  Outlet,
  createRootRouteWithContext,
  redirect
} from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

import { launchQueryOptions } from '@/lib/data'

export const Route = createRootRouteWithContext<{
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
  errorComponent: RootErrorComponent,
  component: RootComponent
})

function RootErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => {
    invoke('mounted')
  }, [])

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
