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

const PathHighlight = ({ text }: { text: string }) => {
  return (
    <span className="px-1.5 pb-0.5 pt-px bg-zinc-800 rounded select-all">
      {text}
    </span>
  )
}

const FormattedError = ({ text }: { text: string }) => {
  const regex = /\b[a-zA-Z]:\\[^:\n\r\*?<>"|]+(?:\\[^:\n\r\*?<>"|]+)*/g
  const parts = []
  let lastIdx = 0

  text.replace(regex, (match, offset) => {
    parts.push(text.slice(lastIdx, offset))
    parts.push(<PathHighlight key={offset} text={match} />)
    lastIdx = offset + match.length
    return ''
  })

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }

  return <motion.p variants={moveInVariants}>{parts}</motion.p>
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
      className="w-screen h-screen flex overflow-hidden"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="p-8 pr-0 flex justify-center flex-col w-full"
        variants={staggerChildrenVariants}
      >
        {/* <TanstackErrorComponent error={error} /> */}
        <motion.h1
          className="font-medium text-xl mb-1"
          variants={moveInVariants}
        >
          Oops! Something went wrong.
        </motion.h1>
        <FormattedError text={error.message} />
        <motion.div className="mt-4 flex gap-2" variants={moveInVariants}>
          <button
            className="select-none rounded-lg bg-zinc-50 px-4 py-2 text-center font-medium text-black transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-200/70 focus-visible:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95"
            onClick={() => {
              // Reset the router error boundary
              reset()
              // Invalidate the route to reload the loader
              router.invalidate()
            }}
          >
            Retry
          </button>
          <button
            className="select-none rounded-lg bg-zinc-700 px-4 py-2 text-center font-medium text-white transition-[background-color,box-shadow,transform] will-change-transform hover:bg-zinc-500/70 focus-visible:bg-zinc-500/70 focus-visible:outline-none focus-visible:ring focus-visible:ring-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={status !== 'idle'}
            onClick={() => {
              mutate()
            }}
          >
            Reset to Defaults
          </button>
          {/* TODO: report error */}
        </motion.div>
      </motion.div>
      <img
        src="/tracer.png"
        alt="logo"
        className={clsx(
          'h-full w-auto pt-20 transition-opacity duration-500',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="eager"
        onLoad={() => setImageLoaded(true)}
      />
    </motion.main>
  )
}
