import { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { exists, BaseDirectory, readDir } from '@tauri-apps/api/fs'

function App() {
  const [response, setResponse] = useState('')

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  //   setGreetMsg(await invoke('greet', { name }))
  // }

  return (
    <div className="p-4">
      <button
        className="select-none rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300 active:scale-95"
        onClick={async () => {
          setResponse('')
          // const entries = await readDir('../Battle.net', {
          //   dir: BaseDirectory.AppData,
          //   recursive: true
          // })
          // console.log(entries)
          // await exists('avatar.png', { dir: BaseDirectory.AppData }).then(
          //   (res) => {
          //     console.log(res)
          //   }
          // )
          try {
            const val = await invoke('set_map', { map: 'heroes' })
            console.log(val)
            setResponse(val as string)
          } catch (error) {
            setResponse(error as string)
          }
        }}
      >
        Greet
      </button>
      {/* <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          greet()
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      */}
      <p>{response}</p>
    </div>
  )
}

export default App
