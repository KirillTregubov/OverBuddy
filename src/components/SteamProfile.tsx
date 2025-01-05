import clsx from 'clsx'
import { HashIcon } from 'lucide-react'

import Overwatch from '@/assets/Overwatch'
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
            'block rounded shadow-inner',
            large ? 'mb-1 max-h-28 brightness-[0.35]' : 'max-h-16 brightness-50'
            // !account.has_overwatch ? 'brightness-50' : 'brightness-[0.35]'
          )}
        />

        {account.has_overwatch && (
          <div
            className={clsx(
              'absolute flex items-center rounded',
              large
                ? 'inset-0 justify-center bg-orange-900/15'
                : 'bottom-1 left-1 right-1 justify-end'
            )}
            title="Has Overwatch Installed"
          >
            <Overwatch
              className={clsx(['drop-shadow', large ? 'size-12' : 'size-6'])}
            />
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
