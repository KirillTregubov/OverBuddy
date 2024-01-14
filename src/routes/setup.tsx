import { FileRoute, Link } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { useState } from 'react'

export const Route = new FileRoute('/').createRoute({
  component: Setup
})

function Setup() {
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
    <div>
      <h1>Setup</h1>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <button
            className="select-none rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-300 active:scale-95"
            onClick={get_setup}
          >
            Get Setup
          </button>
          {setup === null ? (
            <p>Click the button to get the setup</p>
          ) : (
            <code>
              <pre>{JSON.stringify(setup, null, 2)}</pre>
            </code>
          )}
        </div>
        {error.length > 0 && (
          <p className="font-bold text-red-500">Error: {error}</p>
        )}
      </div>
      <Link to="/menu" replace>
        Menu
      </Link>
    </div>
  )
}
