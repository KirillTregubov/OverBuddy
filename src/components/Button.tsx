import { buttonClasses } from '@/lib/button'
import { cn } from '@/lib/utils'
import { Link, type LinkProps } from '@tanstack/react-router'
import { motion, type HTMLMotionProps } from 'framer-motion'
import type { HTMLProps } from 'react'

type ButtonProps = {
  children: React.ReactNode
  primary?: boolean
  destructive?: boolean
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
      draggable={false}
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
      draggable={false}
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
      {...props}
      className={buttonClasses(className, { primary, destructive })}
    >
      {children}
    </motion.button>
  )
}

export function ExternalLinkInline({
  children,
  className,
  ...props
}: HTMLProps<HTMLAnchorElement>) {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      draggable={false}
      {...props}
      className={cn(
        'rounded-sm underline underline-offset-2 transition hover:text-white focus-visible:text-white focus-visible:outline-none active:text-zinc-200',
        className
      )}
    >
      {children}
    </a>
  )
}
