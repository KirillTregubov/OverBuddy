export function isDev() {
  return import.meta.env.MODE === 'development'
}

export const mode = isDev() ? 'dev' : 'release'
