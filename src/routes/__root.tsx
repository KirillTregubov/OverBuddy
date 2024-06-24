import { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { useEffect } from 'react'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  // notFoundComponent: () => <ErrorComponent error={Error('Not Found')} />,
  component: RootComponent
})

function RootComponent() {
  useEffect(() => {
    invoke('mounted')
  }, [])

  return (
    <div className="h-screen min-h-screen">
      <Outlet />
    </div>
  )
}
