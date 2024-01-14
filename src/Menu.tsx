import MomentumScroll from './MomentumScroll'
import placeholder from './assets/placeholder.svg'
import { useHorizontalDivScroll } from './lib/useHorizontalScroll'

export default function Menu() {
  //   const scrollRef = useHorizontalDivScroll()
  return (
    <div className="flex h-screen max-h-screen flex-col p-4">
      <div className="flex h-full w-full rounded-lg bg-red-500"></div>
      {/* <div className="flex-shrink-1 flex-1">
          <img
            alt="Selected Wallpaper"
            className="h-full w-full rounded-lg object-cover"
            height={1080}
            src={placeholder}
            style={{
              aspectRatio: '1920/1080',
              objectFit: 'cover'
            }}
            width={1920}
          />
        </div> */}
      {/* <div
        // ref={scrollRef}
        className="mt-4 flex h-48 flex-shrink-0 gap-4 overflow-x-auto scroll-smooth"
      >
        <div className="w-52 shrink-0 snap-center" />
        {[...Array(5)].map((_, i) => (
          <img
            key={'wallpaper-' + i}
            alt={`Wallpaper ${i}`}
            className="aspect-video select-none snap-center rounded-lg object-cover"
            src={placeholder}
          />
        ))}
        <div className="w-52 shrink-0 snap-center" />
      </div> */}
      <MomentumScroll className="mt-4 flex h-48 shrink-0 gap-4 overflow-x-auto">
        {/* <div className="h-[200vh] bg-red-200">hello</div> */}
        {[...Array(6)].map((_, i) => (
          <img
            key={'wallpaper-' + i}
            alt={`Wallpaper ${i}`}
            className="aspect-video select-none snap-center rounded-lg object-cover"
            src={placeholder}
          />
        ))}
      </MomentumScroll>
    </div>
  )
}
