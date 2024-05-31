import { LoaderPinwheel } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoaderPinwheel className="animate-spin text-zinc-600" size={36} />
    </div>
  )
}
