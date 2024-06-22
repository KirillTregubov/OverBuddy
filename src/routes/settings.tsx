import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'

import { MotionButton } from '@/components/Button'
import { fadeInFastVariants, moveInLessVariants } from '@/lib/animations'
import { settingsQueryOptions, useResetMutation } from '@/lib/data'
import clsx from 'clsx'
import { ArrowLeftIcon, LoaderPinwheel } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(settingsQueryOptions),
  component: Settings
})

function Settings() {
  const router = useRouter()
  const handleEscapePress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      router.history.back()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleEscapePress)

    return () => {
      document.removeEventListener('keydown', handleEscapePress)
    }
  }, [handleEscapePress])

  return (
    <motion.div
      className="relative flex h-full w-full select-none flex-col p-6"
      variants={fadeInFastVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex h-full w-full flex-col gap-2"
        variants={moveInLessVariants}
      >
        <div>
          <button
            onClick={() => router.history.back()}
            className="flex items-center gap-0.5 rounded-full pl-1 pr-2 font-medium text-zinc-400 transition-[box-shadow,color,background-color] hover:text-zinc-50 focus-visible:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeftIcon size={20} />
            Close
          </button>
        </div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3 text-zinc-400">
            <h2 className="text-xl font-bold text-white">Platforms</h2>
            <p className="">Connected platform(s) you use to play Overwatch.</p>
          </div>
          {/* list battle.net and steam platforms, all steam users detected under it */}
          {/* button to scan steam users */}
          <div className="h-32 w-full rounded-lg bg-zinc-700"></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3 text-zinc-400">
            <h2 className="text-xl font-bold text-white">Reset</h2>
            <p className="">Reset all settings to default.</p>
          </div>
          <ResetButton />
        </div>
      </motion.div>
    </motion.div>
  )
}

type State = 'idle' | 'confirm' | 'pending' | 'success'

function ResetButton() {
  const router = useRouter()
  const { mutate, reset: resetMutation } = useResetMutation({
    onSuccess: () => {
      router.navigate({
        to: '/setup',
        replace: true
      })
    },
    onError: () => {
      resetMutation()
      setIsConfirming('idle')
    },
    onSettled: () => {
      resetMutation()
    }
  })
  const [isConfirming, setIsConfirming] = useState<State>('idle')

  const handleClick = useCallback(() => {
    if (isConfirming === 'idle') {
      setIsConfirming('confirm')
      return
    } else if (isConfirming === 'confirm') {
      setIsConfirming('pending')
      mutate()
      return
    }
  }, [isConfirming])

  return (
    <div className="flex gap-2">
      <AnimatePresence mode="wait">
        {isConfirming === 'idle' && (
          <MotionButton
            key="idle"
            className="w-fit min-w-36"
            onClick={handleClick}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.15 } }}
          >
            <span>Reset Settings</span>
          </MotionButton>
        )}
        {isConfirming !== 'idle' && (
          <motion.div
            key="prompt"
            className="flex gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.15 } }}
          >
            <MotionButton
              key="cancel"
              className="w-fit min-w-36"
              onClick={() => setIsConfirming('idle')}
              disabled={isConfirming !== 'confirm'}
            >
              Cancel
            </MotionButton>
            <AnimatePresence mode="wait">
              <MotionButton
                key={isConfirming}
                className={clsx(
                  'w-fit min-w-[28rem]',
                  isConfirming === 'pending' && 'pointer-events-none'
                )}
                destructive={isConfirming === 'confirm'}
                onClick={handleClick}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
              >
                <AnimatePresence mode="wait">
                  {isConfirming === 'confirm' && (
                    <span>
                      Confirm Reset Settings? (This action cannot be undone)
                    </span>
                  )}
                  {isConfirming === 'pending' && (
                    <LoaderPinwheel className="mx-auto animate-spin" />
                  )}
                </AnimatePresence>
              </MotionButton>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      {/* <AnimatePresence mode="wait">
        {isConfirming === 'idle' && (
          <MotionButton
            key="button"
            className="w-fit min-w-40"
            onClick={() => setIsConfirming('confirm')}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.15 } }}
          >
            Reset Settings
          </MotionButton>
        )}
        {isConfirming === 'confirm' && (
          <>
            <MotionButton
              key="button"
              className="w-fit min-w-40"
              onClick={() => setIsConfirming('idle')}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              Cancel
            </MotionButton>
            <MotionButton
              key="confirm"
              destructive
              className="w-fit px-6"
              onClick={() => setIsConfirming('pending')}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              Confirm Reset Settings? (This action cannot be undone)
            </MotionButton>
          </>
        )}
      </AnimatePresence> */}
    </div>
  )
}
