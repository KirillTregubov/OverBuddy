/* eslint-disable */
import { cn } from '@/lib/utils'
import { forwardRef, useState, type ImgHTMLAttributes } from 'react'

const AnimatedImage = forwardRef<
  HTMLImageElement,
  ImgHTMLAttributes<HTMLImageElement> & {
    containerClassName?: string
  }
>(({ containerClassName, onLoad, ...props }, ref) => {
  const [blur, setBlur] = useState(true)
  return (
    <div className={cn('block overflow-hidden', containerClassName)}>
      <img
        ref={ref}
        {...props}
        style={{
          filter: blur ? 'blur(8px)' : 'none',
          transition: blur ? 'none' : 'filter 0.3s ease-out'
        }}
        onLoad={(e) => {
          setBlur(false)
          onLoad?.(e)
        }}
      />
    </div>
  )
})
AnimatedImage.displayName = 'AnimatedImage'

export default AnimatedImage
