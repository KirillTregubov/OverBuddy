import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'

import { FormattedError } from '@/components/Error'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { useResetMutation } from '@/lib/data'
import { useQueryClient } from '@tanstack/react-query'
import { Button, MotionButton } from './Button'
import { ReportButton } from './Reporter'
import TracerImage from './TracerImage'

export default function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  if (typeof error === 'string') {
    error = Error(error)
  }

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
        {/* <TanstackErrorComponent error={error} /> */}
        <motion.h1
          className="mb-1 select-none text-xl font-medium"
          variants={moveInVariants}
        >
          Oops! Something went wrong.
        </motion.h1>
        <motion.p
          variants={moveInVariants}
          className="text-balance leading-relaxed"
        >
          <FormattedError text={error.message} />
        </motion.p>
        <motion.div className="mt-4 flex gap-2" variants={moveInVariants}>
          <Button
            primary
            onClick={() => {
              reset() // reset router error boundary
              router.invalidate() // reload the loader
              queryClient.resetQueries() // reset all queries
            }}
          >
            Reload
          </Button>
          <ReportButton error={error} />
          <ResetButton reset={reset} />
        </motion.div>
      </motion.div>
      <TracerImage />
    </motion.main>
  )
}

function ResetButton({ reset }: Omit<ErrorComponentProps, 'error'>) {
  const router = useRouter()
  const {
    status,
    mutate,
    reset: resetMutation
  } = useResetMutation({
    onSuccess: () => {
      reset()
      router.navigate({
        to: '/setup',
        replace: true
      })
    },
    onSettled: () => {
      resetMutation()
    }
  })
  const [isConfirming, setIsConfirming] = useState<
    'idle' | 'confirm' | 'pending'
  >('idle')

  const handleClick = useCallback(() => {
    if (isConfirming === 'idle') {
      setIsConfirming('confirm')
      return
    } else if (isConfirming === 'confirm') {
      setIsConfirming('pending')
      mutate()
      return
    }
  }, [isConfirming, mutate])

  return (
    <AnimatePresence mode="wait">
      <MotionButton
        disabled={isConfirming === 'pending' || status !== 'idle'}
        destructive={isConfirming === 'confirm'}
        onClick={handleClick}
        key={isConfirming}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 0.15 } }}
      >
        {isConfirming === 'idle' && 'Reset Settings'}
        {isConfirming === 'confirm' &&
          'Confirm Reset Settings (Cannot be undone)'}
      </MotionButton>
    </AnimatePresence>
  )
}
