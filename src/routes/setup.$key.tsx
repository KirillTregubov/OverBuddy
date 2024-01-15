import { FileRoute } from '@tanstack/react-router'

export const Route = new FileRoute('/setup/$key').createRoute({
  //   errorComponent: PostErrorComponent as any,
  component: ConfigureComponent
})

function ConfigureComponent() {
  const { key } = Route.useParams()

  return (
    <div>
      Configure
      {key}
    </div>
  )
}
