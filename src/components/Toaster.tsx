import { Toaster as SonnerToaster } from 'sonner'

export default function Toaster() {
  return (
    <SonnerToaster
      className="toaster right-6 top-3"
      position="top-right"
      richColors
      expand
      toastOptions={{
        // duration: 2000,
        classNames: {
          toast: 'select-none w-max max-w-[28rem]',
          title: 'text-balance',
          actionButton: '!ml-1 font-semibold'
        },
        closeButton: true
      }}
      offset="0.75rem"
    />
  )
}
