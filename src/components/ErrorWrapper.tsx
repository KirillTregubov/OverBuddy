import { motion } from 'motion/react'

import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import TracerImage from './TracerImage'

export default function ErrorWrapper({
  title,
  description,
  buttons
}: {
  title: string
  description: React.ReactNode
  buttons: React.ReactNode
}) {
  return (
    <motion.main
      className="max-w-screen flex h-screen w-screen overflow-hidden"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex w-full flex-col justify-center p-8 pr-0"
        variants={staggerChildrenVariants}
      >
        <motion.h1
          className="mb-2 select-none text-xl font-medium"
          variants={moveInVariants}
        >
          {title}
        </motion.h1>
        <motion.div variants={moveInVariants}>{description}</motion.div>
        <motion.div className="mt-4 flex gap-2" variants={moveInVariants}>
          {buttons}
        </motion.div>
      </motion.div>
      <TracerImage />
    </motion.main>
  )
}
