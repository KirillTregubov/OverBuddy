import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

function App() {
  const [configPath, setConfigPath] = useState('')
  const [error, setError] = useState('')
  const [response, setResponse] = useState('')

  async function get_config() {
    setConfigPath('')
    setError('')
    try {
      setConfigPath(await invoke('get_config'))
    } catch (error) {
      setError(error as string)
    }
  }

  async function set_background() {
    setResponse('')
    setError('')
    try {
      setResponse(await invoke('set_background', { name: 'test' }))
    } catch (error) {
      setError(error as string)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <button
          className="select-none rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300 active:scale-95"
          onClick={get_config}
        >
          Get Config
        </button>
        <div>{configPath}</div>
      </div>

      <div>
        <button
          className="select-none rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300 active:scale-95"
          onClick={set_background}
        >
          Set Background
        </button>
        <div>{response}</div>
      </div>

      {error.length > 0 && (
        <p className="font-bold text-red-500">Error: {error}</p>
      )}
    </div>
  )
}

export default App
