import { getReportURL } from '@/lib/errors'
import { Button } from './Button'

export function ReportButton({ error }: { error: Error }) {
  console.log(error)
  const reportURL = getReportURL(error)

  return (
    <Button as="a" target="_blank" href={reportURL}>
      File a Report
    </Button>
  )
}
