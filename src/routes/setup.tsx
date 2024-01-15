import { FileRoute, Outlet } from '@tanstack/react-router'

export const Route = new FileRoute('/setup/_layout').createRoute({
  component: Setup
})

export function Setup() {
  console.log('hello')

  return (
    <div>
      root
      <Outlet />
    </div>
  )
}
