import clsx from 'clsx'
import { CircleXIcon, HashIcon, UserRoundIcon } from 'lucide-react'
import { useState } from 'react'

import type { SteamProfile } from '@/lib/schemas'

export default function SteamProfileComponent({
  account,
  large = false
}: {
  account: SteamProfile
  large?: boolean
}) {
  const [isError, setIsError] = useState(false)

  return (
    <div
      key={account.id}
      className={clsx(large ? 'flex flex-col gap-1' : 'flex shrink-0 gap-2.5')}
    >
      <div className="relative w-fit select-none">
        {!isError && account.avatar ? (
          <img
            src={account.avatar}
            alt={`Avatar of ${account.name}`}
            onError={() => setIsError(true)}
            className={clsx(
              'block rounded shadow-inner brightness-50',
              large ? 'h-28 w-28' : 'size-16'
            )}
            draggable={false}
          />
        ) : (
          <div
            className={clsx(
              'flex items-center justify-center rounded bg-zinc-700 shadow-inner brightness-[0.25]',
              large ? 'size-28' : 'size-16'
            )}
          >
            <UserRoundIcon size={large ? 96 : 48} />
          </div>
        )}
        {account.has_overwatch ? (
          <div
            className={clsx(
              'absolute flex items-center rounded',
              large
                ? 'inset-0 justify-center bg-orange-950/25'
                : 'bottom-1 left-1 right-1 justify-end'
            )}
            title="Found Overwatch Data"
          >
            <img
              src="/overwatch.png"
              alt="logo"
              className={clsx(['drop-shadow', large ? 'size-12' : 'size-6'])}
              loading="eager"
              aria-label="Overwatch Installation Found on this account"
            />
          </div>
        ) : (
          <div
            className={clsx(
              'absolute flex items-center rounded',
              large
                ? 'inset-0 justify-center bg-zinc-950/20'
                : 'bottom-1 left-1 right-1 justify-end'
            )}
            title="No Overwatch Data Found"
          >
            <CircleXIcon
              size={large ? 48 : 24}
              strokeWidth={3}
              className="drop-shadow"
              aria-label="Overwatch Data Not Found for this account"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <h2 className="font-medium text-white" aria-label="Steam Name">
          {account.name}
        </h2>
        <h3
          className="inline-flex items-center text-sm text-zinc-400"
          aria-label="Steam ID"
        >
          <HashIcon size={14} /> {account.id}
        </h3>
      </div>
    </div>
  )
}
