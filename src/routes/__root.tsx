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
    console.log('root fetch')
    const { is_setup } = await queryClient
      .fetchQuery(launchQueryOptions)
      .catch((error) => {
        console.log(error)
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
  // onError: (error) => {
  //   console.log('aa', error)
  // },
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
