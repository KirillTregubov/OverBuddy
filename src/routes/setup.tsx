import { FileRoute, Outlet } from '@tanstack/react-router'

export const Route = new FileRoute('/setup').createRoute({
  component: Setup
})

export function Setup() {
  return (
    <>
      <Outlet />
      <div className="absolute bottom-2.5 w-full text-center text-zinc-400">
        <div className="m-auto max-w-2xl">
          <p>
            Made with ❤️ by <span className="font-bold">Kirill Tregubov</span>.
            Version {import.meta.env.PACKAGE_VERSION} (Beta).
          </p>
          {/* <p>
            Blizzard Entertainment, Battle.net and Overwatch are trademarks or
            registered trademarks of Blizzard Entertainment, Inc. in the U.S.
            and/or other countries.
          </p> */}
        </div>
      </div>
    </>
  )
}
