import { cn } from './utils'

export function buttonClasses(
  className?: string,
  { primary = false, destructive = false } = {}
) {
  return cn(
    'select-none rounded-md px-4 py-2 text-center font-medium transition-[color,background-color,box-shadow,transform,opacity] will-change-transform focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:!opacity-50',
    primary
      ? 'bg-zinc-50 text-black hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70'
      : destructive
        ? 'bg-red-900 text-red-50 hover:bg-red-600/70 focus-visible:bg-red-600/70'
        : 'bg-zinc-800 text-white hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70',
    className
  )
}
