// Prevent F5, Ctrl+R (Windows/Linux), Command+R (Mac) from refreshing the page
export default function preventReload(event: KeyboardEvent) {
  if (
    event.key === 'F5' ||
    (event.ctrlKey && event.key === 'r')
    // || (event.metaKey && event.key === 'r') // macOS
  ) {
    event.preventDefault()
  }
}
