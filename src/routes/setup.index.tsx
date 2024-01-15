import { FileRoute, useNavigate } from '@tanstack/react-router'
import { ConfigError, useSetupMutation } from '../data'
import { toast } from 'sonner'

export const Route = new FileRoute('/setup/').createRoute({
  component: SetupSplash
})

export function SetupSplash() {
  const navigate = useNavigate()
  const mutation = useSetupMutation({
    onError: (error) => {
      if (error instanceof ConfigError) {
        toast.error(error.message)
        if (
          error.error_key === 'BattleNetConfig' ||
          error.error_key === 'BattleNetInstall'
        ) {
          navigate({
            to: '/setup/$key',
            params: {
              key: error.error_key
            },
            replace: true
          })
        }
        return
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      navigate({
        to: '/menu',
        replace: true
      })
    }
  })

  return (
    <div className="mx-auto flex h-full max-w-lg select-none flex-col items-center justify-center">
      <h1 className="mb-6 text-2xl font-medium">
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
            To change your background, this app needs to read and write your
            Battle.net® configuration files. It does{' '}
            <span className="font-medium">NOT</span> modify any game files. To
            apply the changes, your Battle.net® client needs to be restarted.
          </p>
        </div>
      </div>
      <button
        className="w-full select-none rounded-lg bg-white px-5 py-3 font-medium capitalize text-black transition-[color,background-color,border-color,text-decoration-color,fill,stroke,transform] will-change-transform hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/60 active:scale-95"
        onClick={() => mutation.mutate()}
      >
        Continue
      </button>
    </div>
  )
}
