import { buttonClasses } from '@/lib/button'
import { Link, type LinkProps } from '@tanstack/react-router'
import { motion, type HTMLMotionProps } from 'framer-motion'

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
