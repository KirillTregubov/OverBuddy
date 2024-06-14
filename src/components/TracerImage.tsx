import clsx from 'clsx'
import { useState } from 'react'

export default function TracerImage() {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <img
      src="/tracer.png"
      alt="logo"
      className={clsx(
        'h-full w-auto pb-6 pt-20 transition-opacity duration-500',
        imageLoaded ? 'opacity-100' : 'opacity-0'
      )}
      loading="eager"
      onLoad={() => setImageLoaded(true)}
      draggable={false}
    />
  )
}
