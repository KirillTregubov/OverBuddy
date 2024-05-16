/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SetupImport } from './routes/setup'
import { Route as MenuImport } from './routes/menu'
import { Route as IndexImport } from './routes/index'
import { Route as SetupIndexImport } from './routes/setup/index'
import { Route as SetupSelectImport } from './routes/setup/select'
import { Route as SetupKeyImport } from './routes/setup/$key'

// Create/Update Routes

const SetupRoute = SetupImport.update({
  path: '/setup',
  getParentRoute: () => rootRoute,
} as any)

const MenuRoute = MenuImport.update({
  path: '/menu',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const SetupIndexRoute = SetupIndexImport.update({
  path: '/',
  getParentRoute: () => SetupRoute,
} as any)

const SetupSelectRoute = SetupSelectImport.update({
  path: '/select',
  getParentRoute: () => SetupRoute,
} as any)

const SetupKeyRoute = SetupKeyImport.update({
  path: '/$key',
  getParentRoute: () => SetupRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/menu': {
      id: '/menu'
      path: '/menu'
      fullPath: '/menu'
      preLoaderRoute: typeof MenuImport
      parentRoute: typeof rootRoute
    }
    '/setup': {
      id: '/setup'
      path: '/setup'
      fullPath: '/setup'
      preLoaderRoute: typeof SetupImport
      parentRoute: typeof rootRoute
    }
    '/setup/$key': {
      id: '/setup/$key'
      path: '/$key'
      fullPath: '/setup/$key'
      preLoaderRoute: typeof SetupKeyImport
      parentRoute: typeof SetupImport
    }
    '/setup/select': {
      id: '/setup/select'
      path: '/select'
      fullPath: '/setup/select'
      preLoaderRoute: typeof SetupSelectImport
      parentRoute: typeof SetupImport
    }
    '/setup/': {
      id: '/setup/'
      path: '/'
      fullPath: '/setup/'
      preLoaderRoute: typeof SetupIndexImport
      parentRoute: typeof SetupImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexRoute,
  MenuRoute,
  SetupRoute: SetupRoute.addChildren({
    SetupKeyRoute,
    SetupSelectRoute,
    SetupIndexRoute,
  }),
})

/* prettier-ignore-end */
