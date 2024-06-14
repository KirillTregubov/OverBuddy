import { Button } from './Button'

function getReportURL(error: Error) {
  const body = encodeURIComponent(`### Error\n\n\`\`\`\n${error.stack}\n\`\`\``)
  return `https://github.com/KirillTregubov/OverBuddy/issues/new?body=${body}`
}

export function ReportButton({ error }: { error: Error }) {
  const reportURL = getReportURL(error)

  return (
    <Button as="a" target="_blank" href={reportURL}>
      File a Report
    </Button>
  )
}
