import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import React from 'react'
import ReactDOM from 'react-dom/client'

import ErrorComponent from '@/components/ErrorComponent'
import Loading from '@/components/Loading'
import Toaster from '@/components/Toaster'
import { routeTree } from '@/routeTree.gen'
import '@/styles.css'
import NotFound from './components/NotFound'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    },
    mutations: {
      throwOnError: true
    }
  }
})

const router = createRouter({
  routeTree,
  context: {
    queryClient
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  notFoundMode: 'root',
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: Loading
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// const TanStackRouterDevtools =
//   process.env.NODE_ENV === 'production'
//     ? () => null // Render nothing in production
//     : React.lazy(() =>
//         // Lazy load in development
//         import('@tanstack/router-devtools').then((res) => ({
//           default: res.TanStackRouterDevtools
//           // For Embedded Mode
//           // default: res.TanStackRouterDevtoolsPanel
//         }))
//       )

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <React.StrictMode>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {/* <React.Suspense>
          <TanStackRouterDevtools router={router} />
        </React.Suspense> */}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </React.StrictMode>
  )
}
