import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-dialog'
import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Button, MotionLink } from '@/components/Button'
import { AppErrorView } from '@/components/ErrorComponent'
import KeyboardButton from '@/components/KeyboardButton'
import { ReportButton } from '@/components/Reporter'
import {
  NoSteamOverwatchView,
  SetupIncompleteView,
  SetupSelectView,
  SetupSplashView,
  SteamSetupView,
} from '@/components/SetupViews'
import Version from '@/components/Version'
import type { ConfigErrors } from '@/lib/errors'
import { linkFix } from '@/lib/linkFix'
import type { Platform, SteamProfile } from '@/lib/schemas'
import useKeyPress from '@/lib/useKeyPress'

export const Route = createFileRoute('/gallery')({
  component: PageGallery,
})

type GalleryPage = {
  description: string
  id: string
  render: () => React.ReactNode
  title: string
}

const fakeProfiles: SteamProfile[] = [
  {
    id: '76561198000000001',
    name: 'TracerMain',
    avatar: null,
    has_overwatch: true,
  },
  {
    id: '76561198000000002',
    name: 'WorkshopAlt',
    avatar: null,
    has_overwatch: false,
  },
]

const setupIssues: Array<{
  defaultPath: string | null
  id: string
  issue: ConfigErrors
  message: string
  path: string | null
  title: string
}> = [
  {
    id: 'setup-battlenet-install',
    issue: 'BattleNetInstall',
    title: 'Setup Error: Battle.net Install',
    message: 'Unable to find a Battle.net installation.',
    path: 'C:\\Program Files (x86)\\Battle.net',
    defaultPath: 'C:\\Program Files (x86)\\Battle.net\\Battle.net Launcher.exe',
  },
  {
    id: 'setup-battlenet-config',
    issue: 'BattleNetConfig',
    title: 'Setup Error: Battle.net Config',
    message: 'Unable to find your Battle.net configuration file.',
    path: 'C:\\ProgramData\\Battle.net',
    defaultPath: 'C:\\ProgramData\\Battle.net\\Battle.net.config',
  },
  {
    id: 'setup-steam-install',
    issue: 'SteamInstall',
    title: 'Setup Error: Steam Install',
    message: 'Unable to find a Steam installation.',
    path: 'C:\\Program Files (x86)\\Steam',
    defaultPath: 'C:\\Program Files (x86)\\Steam\\steam.exe',
  },
  {
    id: 'setup-steam-account',
    issue: 'SteamAccount',
    title: 'Setup Error: Steam Account',
    message: 'Unable to find a Steam account with Overwatch data.',
    path: 'C:\\Program Files (x86)\\Steam',
    defaultPath: 'C:\\Program Files (x86)\\Steam\\steam.exe',
  },
]

function PageGallery() {
  const navigate = useNavigate()
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [suppressGalleryEscPress, setSuppressGalleryEscPress] = useState(false)
  const [galleryPlatforms, setGalleryPlatforms] = useState<Platform[]>([
    'BattleNet',
    'Steam',
  ])
  const backToSettingsRef = useRef<HTMLAnchorElement>(null)
  const backToGallery = useCallback(() => {
    setSelectedPageId(null)
    navigate({ to: '/gallery', replace: true })
  }, [navigate])
  const selectGalleryFile = useCallback(
    async (issue: ConfigErrors, defaultPath: string | null) => {
      try {
        await open({
          filters: [
            {
              name:
                issue === 'BattleNetInstall'
                  ? 'Battle.net Launcher'
                  : issue === 'BattleNetConfig'
                    ? 'Configuration File'
                    : 'steam',
              extensions: [issue.endsWith('Config') ? 'config' : 'exe'],
            },
          ],
          defaultPath: defaultPath || undefined,
        })
      } finally {
        backToGallery()
      }
    },
    [backToGallery],
  )
  const toggleGalleryPlatform = useCallback((platform: Platform) => {
    setGalleryPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((item) => item !== platform)
      }
      return [...current, platform]
    })
  }, [])

  const pages = useMemo<GalleryPage[]>(() => {
    return [
      {
        id: 'setup-welcome',
        title: 'Setup: Welcome',
        description: 'Initial welcome and privacy messaging.',
        render: () => (
          <SetupFrame>
            <SetupSplashView showUpdates={false} onContinue={backToGallery} />
          </SetupFrame>
        ),
      },
      {
        id: 'setup-select',
        title: 'Setup: Platform Select',
        description: 'Platform picker with Battle.net and Steam selected.',
        render: () => (
          <SetupFrame>
            <SetupSelectView
              platforms={galleryPlatforms}
              status="idle"
              onTogglePlatform={toggleGalleryPlatform}
              onContinue={backToGallery}
            />
          </SetupFrame>
        ),
      },
      {
        id: 'setup-steam-confirm',
        title: 'Setup: Steam Confirm',
        description: 'Steam account confirmation with fake accounts.',
        render: () => (
          <SetupFrame>
            <SteamSetupView
              profiles={fakeProfiles}
              status="idle"
              onConfirm={backToGallery}
            />
          </SetupFrame>
        ),
      },
      {
        id: 'setup-no-steam-overwatch',
        title: 'Setup: No Steam Overwatch',
        description: 'Steam setup failure screen.',
        render: () => (
          <NoSteamOverwatchView
            onBack={backToGallery}
            onRestart={backToGallery}
          />
        ),
      },
      ...setupIssues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.message,
        render: () => (
          <SetupIncompleteView
            issue={issue.issue}
            message={issue.message}
            path={issue.path}
            defaultPath={issue.defaultPath}
            isSetup={false}
            onBack={backToGallery}
            onRetry={backToGallery}
            onSelect={() => selectGalleryFile(issue.issue, issue.defaultPath)}
          />
        ),
      })),
      {
        id: 'generic-error',
        title: 'Error: Generic App Error',
        description: 'Default router/query error state.',
        render: () => (
          <AppErrorView
            error={
              new Error(
                'Failed to load OverBuddy data. This is a scaffolded gallery error.',
              )
            }
            onReload={backToGallery}
            reportButton={
              <ReportButton
                error={
                  new Error(
                    'Scaffolded gallery error. This is not a real error.',
                  )
                }
              />
            }
            resetButton={
              <Button onClick={backToGallery}>Reset Settings</Button>
            }
          />
        ),
      },
    ]
  }, [
    backToGallery,
    galleryPlatforms,
    selectGalleryFile,
    toggleGalleryPlatform,
  ])

  const selectedPage = pages.find((page) => page.id === selectedPageId)
  const onEscapePress = useCallback(
    async (event: KeyboardEvent) => {
      event.preventDefault()
      if (selectedPageId) {
        setSuppressGalleryEscPress(true)
        backToGallery()
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      backToSettingsRef.current?.click()
    },
    [backToGallery, selectedPageId],
  )
  const { pressed } = useKeyPress({
    key: 'Escape',
    onPress: onEscapePress,
    onPressEnd: () => setSuppressGalleryEscPress(false),
  })
  const galleryEscPressed = pressed && !suppressGalleryEscPress

  if (selectedPage) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <div className="fixed left-4 top-4 z-[60] flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-2 shadow-lg shadow-zinc-950/70 backdrop-blur">
          <button
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none"
            onClick={backToGallery}
          >
            <ArrowLeftIcon size={16} />
            Back to Gallery
            <KeyboardButton
              isPressed={pressed}
              className="ml-1"
              shouldTransition={false}
            >
              Esc
            </KeyboardButton>
          </button>
          <span className="select-none px-2 text-sm text-zinc-400">
            {selectedPage.title}
          </span>
        </div>
        {selectedPage.render()}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col overflow-y-auto p-6 pr-3">
      <div className="pointer-events-none fixed left-0 right-3 top-0 z-10 h-6 bg-easing-t-menu-top" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              Page Gallery
            </h1>
            <p className="mt-1 text-zinc-400">
              View a collection of all the OverBuddy app screens.
            </p>
          </div>
          <div className="-mr-1 select-none">
            <MotionLink
              ref={backToSettingsRef}
              to="/settings"
              replace
              {...linkFix}
              className="group mx-0.5 -mb-1 flex items-center gap-1.5 rounded-md pb-0.5 font-medium text-zinc-400 transition duration-150 will-change-transform hover:text-zinc-50 focus-visible:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100 active:scale-95"
            >
              <span className="flex items-center gap-1">
                <ArrowLeftIcon size={22} />
                <span>Back to Settings</span>
              </span>
              <KeyboardButton
                isPressed={galleryEscPressed}
                className="mb-1"
                shouldTransition={false}
              >
                Esc
              </KeyboardButton>
            </MotionLink>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <div
              key={page.id}
              role="button"
              tabIndex={0}
              className="flex min-h-80 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70 text-left shadow-zinc-800 transition hover:border-zinc-700 hover:bg-zinc-800/70 hover:shadow-lg focus-visible:border-zinc-100 focus-visible:outline-none"
              onClick={() => setSelectedPageId(page.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedPageId(page.id)
                }
              }}
            >
              <span className="relative block aspect-video overflow-hidden border-b border-zinc-800 bg-zinc-950">
                <span
                  className="pointer-events-none absolute left-0 top-0 block h-[720px] w-[1280px] origin-top-left select-none"
                  style={{ transform: 'scale(0.25)' }}
                  aria-hidden
                  inert
                >
                  {page.render()}
                </span>
                <span className="pointer-events-none absolute inset-0 bg-zinc-950/10 ring-1 ring-inset ring-white/5" />
              </span>
              <span className="flex flex-1 flex-col justify-between p-4">
                <span>
                  <span className="block font-semibold text-zinc-100">
                    {page.title}
                  </span>
                  <span className="mt-2 block text-sm text-zinc-400">
                    {page.description}
                  </span>
                </span>
                <span className="mt-4 text-sm font-medium text-orange-300">
                  View Page
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-0 left-0 right-3 z-10 h-6 bg-easing-b-menu-top" />
    </div>
  )
}

function SetupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full pb-8">
      {children}
      <div className="absolute bottom-0 w-full select-none pb-3 text-center text-zinc-400">
        <div className="m-auto max-w-xl">
          <p>
            Made with ❤️ by <span className="font-bold">Kirill Tregubov</span>.{' '}
            <Version />.
          </p>
        </div>
      </div>
    </div>
  )
}
