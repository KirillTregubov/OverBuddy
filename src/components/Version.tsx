import { mode } from '@/lib/dev'

export default function Version() {
  return (
    <>
      Version{' '}
      <span className="proportional-nums">
        {import.meta.env.PACKAGE_VERSION}
      </span>{' '}
      ({mode})
    </>
  )
}
