import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderPinwheel } from 'lucide-react'
import { useRef } from 'react'

import SteamProfileComponent from '@/components/SteamProfile'
import type { SteamProfile } from '@/lib/schemas'
import { useIsOverflow } from '@/lib/useIsOverflow'

export default function SteamProfileList({
  steam_profiles,
  isFetching
}: {
  steam_profiles: SteamProfile[]
  isFetching: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isOverflow = useIsOverflow(ref)

  return (
    <motion.div
      ref={ref}
      key="steam_profiles"
      className={clsx(
        'scroller scroller-settings z-10 -mb-2 -mr-3 flex cursor-auto gap-6 overflow-x-scroll py-2 last:pr-3',
        isOverflow ? '' : 'scroller-hidden'
      )}
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.15, ease: 'easeInOut' }}
    >
      {steam_profiles.length > 0 ? (
        <>
          {steam_profiles.map((profile) => (
            <SteamProfileComponent key={profile.id} account={profile} />
          ))}
          <motion.div
            className="pointer-events-none absolute bottom-6 right-0 top-6 z-20 block w-4 bg-easing-r-settings"
            aria-hidden
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
            }}
          />
        </>
      ) : (
        <>No Steam Profiles</>
      )}
      <AnimatePresence mode="wait">
        {isFetching && (
          <motion.div
            key="fetching"
            aria-live="polite"
            className="right absolute -right-1 top-1 z-30 flex animate-pulse items-center gap-1 text-sm text-zinc-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.15, ease: 'easeInOut' }
            }}
          >
            <LoaderPinwheel size="1em" className="animate-spin" />
            Updating...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
