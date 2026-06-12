import clsx from 'clsx'
import {
  BookLockIcon,
  CheckCircleIcon,
  CircleIcon,
  GlobeIcon,
  LoaderPinwheel,
  SparklesIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import BattleNet from '@/assets/BattleNet.svg'
import Steam from '@/assets/Steam.svg'
import { Button, ExternalLinkInline, LinkButton, MotionButton } from './Button'
import CheckForUpdates from './CheckForUpdates'
import { FormattedError } from './Error'
import ErrorWrapper from './ErrorWrapper'
import Highlight from './Highlight'
import SteamProfileComponent from './SteamProfile'
import {
  fadeInVariants,
  moveInVariants,
  staggerChildrenVariants,
} from '@/lib/animations'
import type { ConfigErrors } from '@/lib/errors'
import type { Platform, SteamProfile } from '@/lib/schemas'

type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

export function SetupSplashView({
  onContinue,
  showUpdates = true,
}: {
  onContinue?: () => void
  showUpdates?: boolean
}) {
  return (
    <motion.div
      className="mx-auto h-full w-full max-w-xl"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex h-full w-full select-none flex-col items-center justify-center gap-8"
        variants={staggerChildrenVariants}
      >
        <div className="flex flex-col items-center gap-2">
          <motion.img
            src="/logo.png"
            alt="OverBuddy Logo"
            variants={moveInVariants}
            width="64px"
            height="64px"
          />
          <motion.h1 className="text-2xl font-medium" variants={moveInVariants}>
            Welcome to <span className="font-bold">OverBuddy</span>!
          </motion.h1>
        </div>
        <div className="flex flex-col gap-5 text-zinc-400">
          <motion.div
            className="flex items-start gap-4"
            variants={moveInVariants}
          >
            <motion.div className="mt-1 rounded-lg bg-zinc-800 p-3 text-white">
              <SparklesIcon size={20} />
            </motion.div>
            <motion.div>
              <motion.h2 className="mb-1 flex gap-2 text-lg font-medium text-white">
                Personalized Overwatch™ Experience
              </motion.h2>
              <motion.p>
                Customize your Overwatch main menu background to your liking.
                Browse all available backgrounds.
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex items-start gap-4"
            variants={moveInVariants}
          >
            <motion.div className="mt-1 rounded-lg bg-zinc-800 p-3 text-white">
              <GlobeIcon size={20} />
            </motion.div>
            <motion.div>
              <motion.h2 className="mb-1 flex items-center gap-2 text-lg font-medium text-white">
                Free and Transparent
              </motion.h2>
              <motion.p>
                OverBuddy is free to use and{' '}
                <ExternalLinkInline href={import.meta.env.REPOSITORY_URL}>
                  open source
                </ExternalLinkInline>
                . It operates independently and is not affiliated with Blizzard
                Entertainment® or Valve®. You can undo the changes it makes at
                any time by reverting to the default background.
              </motion.p>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex items-start gap-4"
            variants={moveInVariants}
          >
            <motion.div className="mt-1 rounded-lg bg-zinc-800 p-3 text-white">
              <BookLockIcon size={20} />
            </motion.div>
            <motion.div>
              <motion.h2 className="mb-1 flex items-center gap-2 text-lg font-medium text-white">
                Built with Privacy in Mind
              </motion.h2>
              <motion.p className="text-pretty">
                To change the menu background, OverBuddy needs to read and write
                your Battle.net® and/or Steam® configuration files. It does{' '}
                <span className="font-medium text-zinc-300/90">NOT</span> modify
                any game files. Your game client will be restarted to apply the
                changes.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
        <motion.div variants={moveInVariants} className="flex w-full">
          {onContinue ? (
            <Button primary className="w-full py-3" onClick={onContinue}>
              Continue
            </Button>
          ) : (
            <LinkButton
              primary
              className="w-full py-3"
              to="/setup/select"
              replace
            >
              Continue
            </LinkButton>
          )}
        </motion.div>
        {showUpdates && <CheckForUpdates />}
      </motion.div>
    </motion.div>
  )
}

export function SetupSelectView({
  onContinue,
  onTogglePlatform,
  platforms,
  status,
}: {
  onContinue: () => void
  onTogglePlatform: (platform: Platform) => void
  platforms: Platform[]
  status: MutationStatus
}) {
  return (
    <motion.div
      className="mx-auto h-full w-full max-w-xl"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex h-full w-full select-none flex-col items-center justify-center gap-5"
        variants={staggerChildrenVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex flex-col items-center gap-2 text-center text-zinc-400">
          <motion.h1
            className="text-2xl font-medium text-white"
            variants={moveInVariants}
          >
            Connect your Platform(s)
          </motion.h1>
          <motion.p variants={moveInVariants} className="text-balance">
            Select the platform(s) you use to play Overwatch™. OverBuddy will
            automatically detect installations and required configurations.
          </motion.p>
          <motion.p variants={moveInVariants}>
            You can change this later in the settings.
          </motion.p>
        </div>
        <motion.div
          className="grid grid-cols-2 gap-4"
          variants={moveInVariants}
        >
          <PlatformButton
            logo={BattleNet}
            name="Battle.net"
            selected={platforms.includes('BattleNet')}
            disabled={status !== 'idle'}
            onClick={() => onTogglePlatform('BattleNet')}
          />
          <PlatformButton
            logo={Steam}
            name="Steam"
            selected={platforms.includes('Steam')}
            disabled={status !== 'idle'}
            onClick={() => onTogglePlatform('Steam')}
          />
        </motion.div>
        <motion.div className="w-full" variants={moveInVariants}>
          <Button
            primary
            className="flex w-full items-center justify-center gap-2 py-3"
            disabled={status !== 'idle'}
            onClick={onContinue}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="idle"
                >
                  Continue
                </motion.span>
              ) : status === 'pending' || status === 'success' ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key="pending"
                >
                  <LoaderPinwheel className="animate-spin" />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function PlatformButton({
  disabled,
  logo,
  name,
  onClick,
  selected,
}: {
  disabled: boolean
  logo: string
  name: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      className="group flex flex-col items-center gap-2 p-3 outline-none transition-transform duration-200 will-change-transform hover:scale-105 focus-visible:scale-105 active:scale-95 disabled:pointer-events-none"
      onClick={onClick}
      title={`Connect ${name}`}
      disabled={disabled}
    >
      <img
        src={logo}
        alt={`${name} Logo`}
        title={name}
        width="72px"
        height="72px"
        className={clsx(
          'rounded-full ring-zinc-100 grayscale transition will-change-transform group-focus-visible:ring',
          selected
            ? 'grayscale-0 group-active:grayscale'
            : 'group-active:grayscale-0',
        )}
      />
      <h2
        className={clsx(
          'flex items-center gap-1.5 text-center font-medium leading-none transition will-change-transform',
          selected
            ? 'text-white group-active:text-zinc-400'
            : 'text-zinc-400 group-active:text-white',
        )}
      >
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.span initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
              <CheckCircleIcon size={20} />
            </motion.span>
          ) : (
            <motion.span initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
              <CircleIcon size={20} />
            </motion.span>
          )}
        </AnimatePresence>
        {name}
      </h2>
    </button>
  )
}

export function SteamSetupView({
  onConfirm,
  profiles,
  status,
}: {
  onConfirm: () => void
  profiles: SteamProfile[]
  status: MutationStatus
}) {
  return (
    <motion.div
      className="mx-auto h-full w-full max-w-xl"
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex h-full w-full select-none flex-col items-center justify-center gap-8"
        variants={staggerChildrenVariants}
      >
        <div className="flex flex-col items-center gap-2 text-center text-zinc-400">
          <motion.h1
            className="text-2xl font-medium text-white"
            variants={moveInVariants}
          >
            Confirm Steam Account{profiles.length > 1 ? 's' : ''}
          </motion.h1>
          <motion.p variants={moveInVariants}>
            OverBuddy has detected the following Steam account
            {profiles.length > 1 ? 's' : ''}.
          </motion.p>
          <motion.p variants={moveInVariants}>
            New accounts will be automatically detected.
          </motion.p>
        </div>
        <motion.div className="flex gap-8" variants={moveInVariants}>
          {profiles.map((profile) => (
            <SteamProfileComponent key={profile.id} account={profile} large />
          ))}
        </motion.div>
        <MotionButton
          primary
          className="w-full py-3"
          disabled={status !== 'idle'}
          onClick={onConfirm}
          variants={moveInVariants}
        >
          Confirm
        </MotionButton>
      </motion.div>
    </motion.div>
  )
}

export function SetupIncompleteView({
  defaultPath,
  isSetup,
  issue,
  message,
  onBack,
  onRetry,
  onSelect,
  path,
}: {
  defaultPath: string | null
  isSetup: boolean
  issue: ConfigErrors
  message: string
  onBack: () => void
  onRetry?: () => void
  onSelect: () => void
  path: string | null
}) {
  const file =
    issue === 'BattleNetInstall'
      ? 'Battle.net Launcher.exe'
      : issue === 'BattleNetConfig'
        ? 'Battle.net.config'
        : 'steam.exe'

  return (
    <ErrorWrapper
      title="Setup Incomplete"
      description={
        <>
          <p className="mb-2 leading-7">
            <FormattedError text={message} />
          </p>
          <p className="leading-7">
            {issue === 'BattleNetInstall' ? (
              <>
                If you have Battle.net installed, please select the{' '}
                <Highlight>Battle.net Launcher.exe</Highlight> file, which is
                located in your Battle.net installation directory
                {!!path && (
                  <>
                    {' '}
                    (defaults to <Highlight>{path}</Highlight>)
                  </>
                )}
                .
              </>
            ) : issue === 'BattleNetConfig' ? (
              <>
                Please select the <Highlight>Battle.net.config</Highlight> file
                {!!path && (
                  <>
                    , which is expected to be located in{' '}
                    <Highlight>{path}</Highlight>
                  </>
                )}
                .
              </>
            ) : issue === 'SteamInstall' ? (
              <>
                If you have Steam installed, please select the{' '}
                <Highlight>steam.exe</Highlight> file, which is located in your
                Steam installation directory (defaults to{' '}
                <Highlight>{path}</Highlight>).
              </>
            ) : (
              <>
                Please ensure you have logged into an account on Steam. If you
                have already done so, please select the correct{' '}
                <Highlight>steam.exe</Highlight> file, which is located in your
                Steam installation directory (defaults to{' '}
                <Highlight>{path}</Highlight>).
              </>
            )}
          </p>
        </>
      }
      buttons={
        <>
          <Button onClick={onBack}>{isSetup ? 'Go Back' : 'Go Back'}</Button>
          {issue === 'SteamAccount' && (
            <Button onClick={onRetry}>Retry Setup</Button>
          )}
          <Button primary onClick={onSelect} title={defaultPath || undefined}>
            Select {file}
          </Button>
        </>
      }
    />
  )
}

export function NoSteamOverwatchView({
  onBack,
  onRestart,
}: {
  onBack: () => void
  onRestart: () => void
}) {
  return (
    <ErrorWrapper
      title="Cannot Complete Setup"
      description={
        <>
          <p className="mb-2 leading-7">
            No Overwatch installations were found on Steam.
          </p>
          <p className="leading-7">
            Please install Overwatch on Steam and try again. If you&apos;d like
            to use Battle.net instead, <br />
            restart the setup process and select it.
          </p>
        </>
      }
      buttons={
        <>
          <Button onClick={onBack}>Go Back</Button>
          <Button primary onClick={onRestart}>
            Restart Setup
          </Button>
        </>
      }
    />
  )
}
