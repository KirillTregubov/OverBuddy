import clsx from 'clsx'

export default function KeyboardButton({
  children,
  className,
  isPressed = false
}: {
  children: React.ReactNode
  className?: string
  isPressed?: boolean
}) {
  return (
    <span
      className={clsx(
        'm-px mb-0.5 w-fit rounded border px-2.5 pb-px font-medium transition-[background-color,border-color,transform,box-shadow] duration-150 will-change-transform',
        isPressed
          ? 'translate-y-0.5 scale-95 border-zinc-400 bg-zinc-200 text-zinc-700 shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-zinc-400/60'
          : 'border-zinc-700 bg-zinc-800 shadow-[0_0.125rem_0_1px_var(--tw-shadow-color)] shadow-zinc-700/60',
        className
      )}
    >
      {children}
    </span>
  )
}
