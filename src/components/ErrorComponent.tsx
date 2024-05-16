import { ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api'
import { useEffect } from 'react'

export default function RootErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => {
    invoke('mounted')
  }, [])

  if (typeof error === 'string') {
    error = Error(error)
  }

  return (
    <>
      {/* TODO: text, svg, refresh, reset to defaults */}
      <ErrorComponent error={error} />
    </>
  )
}
