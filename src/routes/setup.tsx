import { FileRoute, Link } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { useState } from 'react'

export const Route = new FileRoute('/setup').createRoute({
  component: Setup
})

export function Setup() {
  const [setup, setSetup] = useState<null | Object>(null)
  const [error, setError] = useState('')

  async function get_setup() {
    setSetup({})
    setError('')
    try {
      setSetup(JSON.parse(await invoke('get_setup')))
    } catch (error) {
      setError(error as string)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-lg select-none flex-col items-center justify-center">
      <h1 className="mb-8 text-2xl font-medium">
        Welcome to <span className="font-bold">OverBuddy</span>
      </h1>
      <div className="mb-8 flex flex-col gap-5 text-zinc-400">
        <div>
          <h2 className="mb-1 text-lg font-medium text-white">
            Personalized Overwatch™ Experience
          </h2>
          <p>
            Explore all available backgrounds and select your favourite to
            customize your in-game menu.
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-lg font-medium text-white">
            Free and Open Source
          </h2>
          <p>
            OverBuddy is free to use and open source. It operates independently
            and is not affiliated with Blizzard Entertainment®. You can revert
            the changes made by this app at any time in the settings.
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-lg font-medium text-white">
            Privacy Notice
          </h2>
          <p>
            In order to change your background, it reads and writes your
            Battle.net® configuration files, but does not modify any game
            files. In order to apply the changes, it needs to restart the
            Battle.net® client.
          </p>
        </div>
      </div>
      <button
        className="w-full select-none rounded-lg bg-white px-5 py-3 font-medium text-black transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/60 active:scale-95"
        onClick={get_setup}
      >
        Get Setup
      </button>
      <div className="absolute bottom-2 max-w-2xl text-center text-zinc-400">
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
  )
}

// <h1>Setup</h1>
// <div className="flex flex-col gap-4 p-4">
//   <div>
//     <button
//       className="select-none rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-300 active:scale-95"
//       onClick={get_setup}
//     >
//       Get Setup
//     </button>
//     {setup === null ? (
//       <p>Click the button to get the setup</p>
//     ) : (
//       <code>
//         <pre>{JSON.stringify(setup, null, 2)}</pre>
//       </code>
//     )}
//   </div>
//   {error.length > 0 && (
//     <p className="font-bold text-red-500">Error: {error}</p>
//   )}
// </div>
// <Link to="/menu" replace>
//   Menu
// </Link>
