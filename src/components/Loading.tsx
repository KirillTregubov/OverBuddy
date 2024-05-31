import { fadeInVariants } from '@/lib/animations'
import { motion } from 'framer-motion'
import { LoaderPinwheel } from 'lucide-react'

export default function Loading() {
  return (
    <motion.div
      className="flex h-screen items-center justify-center"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <LoaderPinwheel className="animate-spin text-zinc-700" size={36} />
    </motion.div>
  )
}
