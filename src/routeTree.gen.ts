import { Route as rootRoute } from './routes/__root'
import { Route as SetupImport } from './routes/setup'
import { Route as MenuImport } from './routes/menu'

const SetupRoute = SetupImport.update({
  path: '/setup',
  getParentRoute: () => rootRoute,
} as any)

const MenuRoute = MenuImport.update({
  path: '/menu',
  getParentRoute: () => rootRoute,
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
  }
}
export const routeTree = rootRoute.addChildren([MenuRoute, SetupRoute])
