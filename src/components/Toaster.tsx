import { Toaster as SonnerToaster } from 'sonner'

export default function Toaster() {
  return (
    <SonnerToaster
      className="toaster"
      position="top-right"
      richColors
      expand
      toastOptions={{
        classNames: {
          toast: 'select-none w-96',
          actionButton: 'font-semibold'
        }
      }}
      offset="0.75rem"
    />
  )
}
