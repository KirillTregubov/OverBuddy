import type { SteamProfile } from '@/lib/schemas'
import clsx from 'clsx'
import { HashIcon } from 'lucide-react'

export default function SteamProfileComponent({
  account,
  large = false
}: {
  account: SteamProfile
  large?: boolean
}) {
  return (
    <div key={account.id} className={clsx(!large && 'flex shrink-0 gap-2.5')}>
      <img
        src={account.avatar}
        alt={account.name}
        className={clsx('rounded', large ? 'mb-1 max-h-32' : 'max-h-16')}
      />
      <div className="flex flex-col justify-center">
        <h2 className="font-medium text-white">{account.name}</h2>
        <h3
          className={clsx(
            'inline-flex items-center text-sm',
            large ? 'text-zinc-300' : 'text-zinc-400'
          )}
        >
          <HashIcon size={14} /> {account.id}
        </h3>
      </div>
    </div>
  )
}
