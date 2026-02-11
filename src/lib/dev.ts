export const isDemo = import.meta.env.VITE_DEMO === 'true'

export function isDev() {
  return import.meta.env.MODE === 'development'
}

export const mode = isDev() ? 'dev' : 'release'
