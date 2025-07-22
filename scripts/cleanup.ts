import { readdir, readFile, unlink } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const backgroundsDir = path.join(__dirname, '../public/backgrounds')
const backgroundsFile = path.join(__dirname, '../src-tauri/src/backgrounds.rs')

async function extractUsedImages(): Promise<Set<string>> {
  const content = await readFile(backgroundsFile, 'utf-8')

  const lines = content.split('\n')
  const usedImages = new Set<string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('//')) continue // full-line comment
    if (/^\s*\/\/.*image:/.test(line)) continue // image line commented mid-line

    const match = line.match(/image:\s*"([^"]+)"/)
    if (match) {
      usedImages.add(match[1])
    }
  }

  return usedImages
}

async function listBackgroundFiles(): Promise<string[]> {
  const files = await readdir(backgroundsDir)
  return files.filter((file) => file.toLowerCase().endsWith('.jpg'))
}

async function purgeUnusedImages() {
  const usedImages = await extractUsedImages()
  const backgroundFiles = await listBackgroundFiles()

  const unusedImages = backgroundFiles.filter((file) => !usedImages.has(file))

  if (unusedImages.length === 0) {
    console.log('✅ No unused images found.')
    return
  }

  console.log('🧹 Purging the following unused images...')
  console.log(` 🗑 Deleting: file`)
  for (const file of unusedImages) {
    await unlink(path.join(backgroundsDir, file))
    console.log(` 🗑 Deleted: ${file}`)
  }

  console.log('✅ Purge complete.')
}

purgeUnusedImages().catch((err) => {
  console.error('❌ Error during purge:', err)
})
