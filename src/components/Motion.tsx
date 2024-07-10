import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export const MotionLink = motion(Link)

// type MotionComponentProps<T extends ElementType> = {
//   as: T
// } & React.ComponentPropsWithoutRef<T> &
//   MotionProps

// export const MotionComponent = <T extends ElementType>({
//   as,
//   ...props
// }: MotionComponentProps<T>) => {
//   const Component = motion(as)
//   return <Component {...props} />
// }
