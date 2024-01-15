import {
  ErrorComponent,
  ErrorRouteProps,
  Outlet,
  rootRouteWithContext
} from '@tanstack/react-router'
import { QueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { launchQueryOptions } from '../data'
import { Setup } from './setupaaa'

export const Route = rootRouteWithContext<{
  queryClient: QueryClient
}>()({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(launchQueryOptions),
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
  const { data } = useSuspenseQuery(launchQueryOptions)

  return (
    <div className="h-screen max-h-screen">
      {!data.is_setup ? <Setup /> : <Outlet />}
      <Toaster richColors />
    </div>
  )
}
