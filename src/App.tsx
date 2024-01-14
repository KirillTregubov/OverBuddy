import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import Menu from './Menu'
// import MomentumScroll from './MomentumScroll'

function App() {
  const [setup, setSetup] = useState<null | Object>(null)
  const [error, setError] = useState('')
  const [response, setResponse] = useState('')

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
    <Menu />
    // <div className="flex flex-col gap-4 p-4">
    //   <div>
    //     <button
    //       className="select-none rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300 active:scale-95"
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

    //   <div>
    //     <button
    //       className="select-none rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300 active:scale-95"
    //       onClick={set_background}
    //     >
    //       Set Background
    //     </button>
    //     <div>{response}</div>
    //   </div>

    //   {error.length > 0 && (
    //     <p className="font-bold text-red-500">Error: {error}</p>
    //   )}
    // </div>
  )
}

export default App
