import { Route as rootRoute } from './routes/__root'
import { Route as SetupImport } from './routes/setupaaa'
import { Route as MenuImport } from './routes/menu'
import { Route as SetupIndexImport } from './routes/setup.aas'
import { Route as SetupKeyImport } from './routes/setup.$key'

const SetupRoute = SetupImport.update({
  path: '/setup',
  getParentRoute: () => rootRoute
} as any)

const MenuRoute = MenuImport.update({
  path: '/menu',
  getParentRoute: () => rootRoute
} as any)

const SetupIndexRoute = SetupIndexImport.update({
  path: '/',
  getParentRoute: () => SetupRoute
} as any)

const SetupKeyRoute = SetupKeyImport.update({
  path: '/$key',
  getParentRoute: () => SetupRoute
} as any)
declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/menu': {
      preLoaderRoute: typeof MenuImport
      parentRoute: typeof rootRoute
    }
    '/setup': {
      preLoaderRoute: typeof SetupImport
      parentRoute: typeof rootRoute
    }
    '/setup/$key': {
      preLoaderRoute: typeof SetupKeyImport
      parentRoute: typeof SetupImport
    }
    '/setup/': {
      preLoaderRoute: typeof SetupIndexImport
      parentRoute: typeof SetupImport
    }
  }
}
export const routeTree = rootRoute.addChildren([
  MenuRoute,
  SetupRoute.addChildren([SetupKeyRoute, SetupIndexRoute])
])
