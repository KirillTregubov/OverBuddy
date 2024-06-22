import { cn } from '@/lib/utils'
import { Link, type LinkProps } from '@tanstack/react-router'
import { motion, type HTMLMotionProps } from 'framer-motion'

type ButtonProps = {
  children: React.ReactNode
  primary?: boolean
  destructive?: boolean
}

export function buttonClasses(
  className?: string,
  { primary = false, destructive = false } = {}
) {
  return cn(
    'select-none rounded-lg px-4 py-2 text-center font-medium transition-[color,background-color,box-shadow,transform,opacity] will-change-transform focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:!opacity-50',
    primary
      ? 'bg-zinc-50 text-black hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70'
      : destructive
        ? 'bg-red-900 text-red-50 hover:bg-red-600/70 focus-visible:bg-red-600/70'
        : 'bg-zinc-800 text-white hover:bg-zinc-600/70 focus-visible:bg-zinc-600/70',
    className
  )
}

export function Button<A extends React.ElementType>({
  children,
  // assign A to component
  as: Component = 'button',
  primary = false,
  destructive = false,
  className,
  ...props
}: ButtonProps & { as?: A } & React.ComponentProps<A>) {
  return (
    <Component
      className={buttonClasses(className, { primary, destructive })}
      {...props}
    >
      {children}
    </Component>
  )
}

type RouterLinkProps = LinkProps & React.ComponentProps<typeof Link>

export function LinkButton({
  className,
  primary = false,
  destructive = false,
  children,
  ...props
}: RouterLinkProps & ButtonProps) {
  return (
    <Link
      {...props}
      className={buttonClasses(className, { primary, destructive })}
    >
      {children}
    </Link>
  )
}

export function MotionButton({
  className,
  primary = false,
  destructive = false,
  children,
  ...props
}: ButtonProps & HTMLMotionProps<'button'>) {
  return (
    <motion.button
      className={buttonClasses(className, { primary, destructive })}
      {...props}
    >
      {children}
    </motion.button>
  )
}
