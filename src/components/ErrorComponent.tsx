import { useQueryClient } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import clsx from 'clsx'
import { LoaderPinwheel } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useState } from 'react'

import { FormattedError } from '@/components/Error'
import { useResetMutation } from '@/lib/data'
import { Button, MotionButton } from './Button'
import ErrorWrapper from './ErrorWrapper'
import { ReportButton } from './Reporter'

export default function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  if (typeof error === 'string') {
    error = Error(error)
  }

  return (
    <ErrorWrapper
      title="Oops! Something went wrong."
      description={<FormattedError text={error.message} />}
      buttons={
        <>
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
          <ResetButton
            reset={async () => {
              await router.invalidate()
              reset()
            }}
          />
        </>
      }
    />
  )
}

export type State = 'idle' | 'confirm' | 'pending'

function ResetButton({ reset }: Omit<ErrorComponentProps, 'error'>) {
  const router = useRouter()
  const { mutate, reset: resetMutation } = useResetMutation({
    onSuccess: () => {
      router.navigate({
        to: '/setup',
        replace: true
      })
      reset()
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
  }, [isConfirming, mutate])

  return (
    <AnimatePresence mode="wait">
      <MotionButton
        key={isConfirming}
        className={clsx(isConfirming === 'pending' && 'pointer-events-none')}
        disabled={isConfirming === 'pending'}
        destructive={isConfirming === 'confirm'}
        onClick={handleClick}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 0.15 } }}
      >
        {isConfirming === 'idle' ? (
          <span>Reset Settings</span>
        ) : isConfirming === 'confirm' ? (
          <span>Confirm Reset Settings (Cannot be undone)</span>
        ) : (
          <LoaderPinwheel className="mx-auto animate-spin" />
        )}
      </MotionButton>
    </AnimatePresence>
  )
}
