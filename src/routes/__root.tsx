import {
  ErrorComponent,
  ErrorRouteProps,
  Outlet,
  redirect,
  rootRouteWithContext
} from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { launchQueryOptions } from '../data'

export const Route = rootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    if (location.pathname !== '/') {
      return
    }
    const { is_setup } = await queryClient.ensureQueryData(launchQueryOptions)
    if (!is_setup) {
      throw redirect({ to: '/setup' })
    }
  },
  errorComponent: RootErrorComponent as any,
  component: RootComponent
})

function RootErrorComponent({ error }: ErrorRouteProps) {
  console.log(error)
  if (typeof error === 'string') {
    error = Error(error)
  }

  return <ErrorComponent error={error} />
}

function RootComponent() {
  return (
    <div className="h-screen max-h-screen">
      <Outlet />
      <Toaster richColors />
    </div>
  )
}
