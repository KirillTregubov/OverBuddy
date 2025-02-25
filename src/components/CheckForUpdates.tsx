import { useQuery } from '@tanstack/react-query'
import { relaunch } from '@tauri-apps/plugin-process'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { updateQueryOptions, useUpdateMutation } from '@/lib/data'
import preventReload from '@/lib/preventReload'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './AlertDialog'
import { Progress } from './Progress'

export default function CheckForUpdates() {
  const { data } = useQuery(updateQueryOptions(true))
  const [isOpen, setIsOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const {
    data: updateSuccess,
    status: updateStatus,
    mutate: applyUpdate
  } = useUpdateMutation()

  useEffect(() => {
    if (updateStatus === 'success' && updateSuccess) {
      document.addEventListener('keydown', preventReload)
    }

    return () => {
      document.removeEventListener('keydown', preventReload)
    }
  }, [updateStatus, updateSuccess])

  useEffect(() => {
    if (data?.available) {
      toast.warning('There is a new version of OverBuddy available.', {
        id: 'update-available',
        action: {
          label: 'View Update',
          onClick: () => setIsOpen(true)
        },
        duration: Infinity
      })
    }

    return () => {
      toast.dismiss('update-available')
    }
  }, [data])

  return (
    <>
      <AlertDialog open={isOpen}>
        <AlertDialogContent>
          <AnimatePresence mode="wait" initial={false}>
            {updateStatus === 'idle' ? (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
                key="idle"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    OverBuddy v{data?.version} is available.
                  </AlertDialogTitle>
                  <pre className="whitespace-pre-wrap font-sans">
                    <AlertDialogDescription>
                      {data?.body ?? 'There is no changelog available.'}
                    </AlertDialogDescription>
                  </pre>
                </AlertDialogHeader>
              </motion.span>
            ) : updateStatus === 'success' ? (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
                key="success"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    OverBuddy v{data?.version} has been installed.
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Please restart OverBuddy to complete the update.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.15 } }}
                key="updating"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Updating to OverBuddy v{data?.version}...
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="py-1">
                      <Progress value={progress} />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </motion.span>
            )}
          </AnimatePresence>
          <AlertDialogFooter>
            <AnimatePresence mode="wait" initial={false}>
              {updateStatus === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="cancel"
                >
                  <AlertDialogCancel onClick={() => setIsOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              {updateStatus === 'idle' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="download"
                >
                  <AlertDialogAction onClick={() => applyUpdate(setProgress)}>
                    Download and Install
                  </AlertDialogAction>
                </motion.div>
              ) : updateStatus === 'success' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="restart"
                >
                  <AlertDialogAction onClick={() => relaunch()}>
                    Restart OverBuddy
                  </AlertDialogAction>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                  key="downloading"
                >
                  <AlertDialogAction
                    disabled
                    className="pointer-events-none disabled:!opacity-80"
                  >
                    Downloading...
                  </AlertDialogAction>
                </motion.div>
              )}
            </AnimatePresence>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
