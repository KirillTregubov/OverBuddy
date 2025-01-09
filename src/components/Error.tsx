import Highlight from './Highlight'

export function FormattedError({ text }: { text: string }) {
  const regex = /\[\[([\s\S]*?)\]\]/g
  const parts = []
  let lastIdx = 0

  text.replace(regex, (match, captured, offset) => {
    parts.push(text.slice(lastIdx, offset))
    parts.push(<Highlight key={offset}>{captured}</Highlight>)
    lastIdx = offset + match.length
    return ''
  })

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }

  parts.push('.')

  return parts
}
