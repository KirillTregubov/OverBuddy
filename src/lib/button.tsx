import { cn } from './utils'

export function buttonClasses(
  className?: string,
  { primary = false, destructive = false } = {}
) {
  return cn(
    'select-none rounded-md px-4 py-2 text-center font-medium transition will-change-transform focus-visible:outline-none focus-visible:ring active:scale-95 disabled:cursor-not-allowed disabled:!opacity-50',
    primary
      ? 'bg-zinc-50 text-black ring-white hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70'
      : destructive
        ? 'bg-red-900 text-red-50 ring-zinc-100 hover:bg-red-600/70 focus-visible:bg-red-600/70'
        : 'bg-zinc-800 text-white ring-zinc-100 hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70',
    className
  )
}
