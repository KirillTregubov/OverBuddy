import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants
} from '@/lib/animations'
import { useResetMutation } from '@/lib/data'
import { Button } from './Button'
import Highlight from './Highlight'

const FormattedError = ({ text }: { text: string }) => {
  const regex = /\[\[(.*?)\]\]/g
  const parts = []
  let lastIdx = 0

  text.replace(regex, (match, captured, offset) => {
    parts.push(text.slice(lastIdx, offset))
    parts.push(<Highlight key={offset}>{captured}</Highlight>)
    lastIdx = offset + match.length
    return ''
  })

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }

  return (
    <motion.p variants={moveInVariants} className="text-balance">
      {parts}
    </motion.p>
  )
}

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
  const [imageLoaded, setImageLoaded] = useState(false)

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
        <FormattedError text={error.message} />
        <motion.div className="mt-4 flex gap-2" variants={moveInVariants}>
          <Button
            primary
            onClick={() => {
              // Reset the router error boundary
              reset()

              // Invalidate the route to reload the loader
              router.invalidate()
            }}
          >
            Retry
          </Button>
          <Button disabled={status !== 'idle'} onClick={() => mutate()}>
            Reset to Defaults
          </Button>
          {/* TODO: report error */}
        </motion.div>
      </motion.div>
      <img
        src="/tracer.png"
        alt="logo"
        className={clsx(
          'h-full w-auto pb-6 pt-20 transition-opacity duration-500',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="eager"
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />
    </motion.main>
  )
}
