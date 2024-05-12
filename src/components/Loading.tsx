import { LoaderPinwheel } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoaderPinwheel className="animate-spin text-zinc-600" size={36} />
    </div>
  )
}
