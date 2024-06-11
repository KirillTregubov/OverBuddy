import { Link } from '@tanstack/react-router'
import clsx from 'clsx'

type ButtonProps = {
  children: React.ReactNode
  primary?: boolean
}

const defaultClasses =
  'bg-zinc-800 text-white hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70'

const primaryClasses =
  'bg-zinc-50 text-black hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70'

export function buttonClasses(className?: string, primary = false) {
  return clsx(
    'select-none rounded-lg px-4 py-2 text-center font-medium capitalize transition-[background-color,box-shadow,transform] will-change-transform focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
    primary ? primaryClasses : defaultClasses,
    className
  )
}

export function Button<A extends React.ElementType>({
  children,
  // assign A to component
  as: Component = 'button',
  primary = false,
  className,
  ...props
}: ButtonProps & { as?: A } & React.ComponentProps<A>) {
  return (
    <Component className={buttonClasses(className, primary)} {...props}>
      {children}
    </Component>
  )
}

export function LinkButton({
  className,
  primary,
  children,
  ...props
}: React.ComponentProps<typeof Link> & ButtonProps) {
  return (
    <Link {...props} className={buttonClasses(className, primary)}>
      {children}
    </Link>
  )
}
