import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import placeholder from './assets/placeholder.svg'

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

    <div className="flex h-screen max-h-screen flex-col p-4">
      <div className="flex h-full w-full rounded-lg bg-red-500"></div>
      {/* <div className="flex-shrink-1 flex-1">
        <img
          alt="Selected Wallpaper"
          className="h-full w-full rounded-lg object-cover"
          height={1080}
          src={placeholder}
          style={{
            aspectRatio: '1920/1080',
            objectFit: 'cover'
          }}
          width={1920}
        />
      </div> */}
      <div className="mt-4 flex h-48 flex-shrink-0 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth">
        <div className="w-52 shrink-0 snap-center" />
        {[...Array(5)].map((_, i) => (
          <img
            key={'wallpaper-' + i}
            alt={`Wallpaper ${i}`}
            className="aspect-video select-none snap-center rounded-lg object-cover"
            src={placeholder}
          />
        ))}
        <div className="w-52 shrink-0 snap-center" />
        {/* <img
          alt="Wallpaper 2"
          className="aspect-video rounded-lg object-cover"
          height={200}
          src={placeholder}
          width={300}
        />
        <img
          alt="Wallpaper 3"
          className="aspect-video rounded-lg object-cover"
          height={200}
          src={placeholder}
          width={300}
        />
        <img
          alt="Wallpaper 4"
          className="aspect-video rounded-lg object-cover"
          height={200}
          src={placeholder}
          width={300}
        />
        <img
          alt="Wallpaper 5"
          className="aspect-video rounded-lg object-cover"
          height={200}
          src={placeholder}
          width={300}
        /> */}
      </div>
    </div>
  )
}

export default App
