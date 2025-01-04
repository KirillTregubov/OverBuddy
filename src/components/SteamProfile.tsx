import clsx from 'clsx'
import { HashIcon } from 'lucide-react'

import placeholder from '@/assets/placeholder_small.svg'
import type { SteamProfile } from '@/lib/schemas'

export default function SteamProfileComponent({
  account,
  large = false
}: {
  account: SteamProfile
  large?: boolean
}) {
  return (
    <div key={account.id} className={clsx(!large && 'flex shrink-0 gap-2.5')}>
      <div className="relative w-fit">
        <img
          src={account.avatar || placeholder}
          alt={account.name}
          onError={(e) => (e.currentTarget.src = placeholder)}
          className={clsx(
            'block rounded',
            large ? 'mb-1 max-h-28' : 'max-h-16'
          )}
        />
        {account.has_overwatch && (
          <div
            className={clsx(
              'absolute mx-auto flex w-fit items-center justify-center gap-1 rounded-xl bg-neutral-800/75 px-1 text-sm',
              large
                ? 'bottom-1.5 left-1.5 right-1.5 py-0.5 pr-1.5'
                : 'bottom-1 right-1 py-1'
            )}
            title="Has Overwatch Installed"
          >
            <img
              src="/overwatch.png"
              alt="logo"
              className="size-4"
              loading="eager"
            />
            {large && <span>Detected</span>}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <h2 className="font-medium text-white">{account.name}</h2>
        <h3 className="inline-flex items-center text-sm text-zinc-400">
          <HashIcon size={14} /> {account.id}
        </h3>
      </div>
    </div>
  )
}
