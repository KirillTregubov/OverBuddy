import { Toaster as SonnerToaster } from 'sonner'

export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-left"
      richColors
      toastOptions={{
        classNames: {
          toast: 'select-none'
        }
      }}
    />
  )
}
