export function isDev() {
  return import.meta.env.MODE === 'development'
}
