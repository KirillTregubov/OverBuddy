import RootErrorComponent from '@/components/ErrorComponent'
import { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  errorComponent: RootErrorComponent,
  component: RootComponent
})

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
