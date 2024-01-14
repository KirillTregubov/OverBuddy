import { Route as rootRoute } from './routes/__root'
import { Route as MenuImport } from './routes/menu'
import { Route as IndexImport } from './routes/setup'

const MenuRoute = MenuImport.update({
  path: '/menu',
  getParentRoute: () => rootRoute
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute
} as any)
declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/menu': {
      preLoaderRoute: typeof MenuImport
      parentRoute: typeof rootRoute
    }
  }
}
export const routeTree = rootRoute.addChildren([IndexRoute, MenuRoute])
