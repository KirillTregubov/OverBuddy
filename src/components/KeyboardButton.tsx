import { cn } from '@/lib/utils'

export default function KeyboardButton({
  children,
  className,
  isPressed = false,
  shouldTransition = true
}: {
  children: React.ReactNode
  className?: string
  isPressed?: boolean
  shouldTransition?: boolean
}) {
  return (
    <span
      className={cn(
        'm-0.5 mb-[calc(0.25rem+1px)] w-fit select-none rounded border px-2.5 pb-px font-medium will-change-transform',
        isPressed
          ? 'translate-y-0.5 scale-95 border-zinc-400 bg-zinc-200 text-zinc-700 shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-zinc-400/60'
          : 'border-zinc-700 bg-zinc-800 shadow-[0_0.125rem_0_1px_var(--tw-shadow-color)] shadow-zinc-700/60',
        isPressed || shouldTransition ? 'transition' : '',
        className
      )}
    >
      {children}
    </span>
  )
}
