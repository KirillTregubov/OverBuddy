import { Outlet, rootRouteWithContext } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

export const Route = rootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent
})

function RootComponent() {
  return (
    <div className="h-screen max-h-screen">
      <Outlet />
    </div>
  )
}
