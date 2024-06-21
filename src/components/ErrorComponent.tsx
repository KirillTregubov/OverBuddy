import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { useResetMutation } from '@/lib/data'
import { FormattedError } from '@/lib/errors'
import { Button } from './Button'
import { ReportButton } from './Reporter'
import TracerImage from './TracerImage'

export default function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const {
    status,
    mutate,
    reset: resetMutation
  } = useResetMutation({
    onSuccess: () => {
      reset()
      router.navigate({
        to: '/',
        replace: true
      })
    },
    onSettled: () => {
      resetMutation()
    }
  })

  useEffect(() => {
    invoke('mounted')
  }, [])

  if (typeof error === 'string') {
    error = Error(error)
  }

  return (
    <motion.main
      className="flex h-screen w-screen overflow-hidden"
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
        <motion.p variants={moveInVariants} className="text-balance">
          <FormattedError text={error.message} />
        </motion.p>
        <motion.div className="mt-4 flex gap-2" variants={moveInVariants}>
          <Button
            primary
            onClick={() => {
              reset() // reset router error boundary
              router.invalidate() // reload the loader
            }}
          >
            Reload
          </Button>
          <Button disabled={status !== 'idle'} onClick={() => mutate()}>
            Reset to Defaults
          </Button>
          <ReportButton error={error} />
        </motion.div>
      </motion.div>
      <TracerImage />
    </motion.main>
  )
}
