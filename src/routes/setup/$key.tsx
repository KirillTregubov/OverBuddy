import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/setup/$key')({
  component: () => <div>Hello /setup/$key!</div>
})
