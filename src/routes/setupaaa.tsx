import { FileRoute, Outlet } from '@tanstack/react-router'

export const Route = new FileRoute('/setup').createRoute({
  component: Setup
})

export function Setup() {
  console.log('hello')

  return <Outlet />
}
