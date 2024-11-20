import { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent
})

function RootComponent() {
  return (
    <div className="h-screen min-h-screen">
      <Outlet />
    </div>
  )
}
