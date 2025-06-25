import { exec } from 'child_process'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const gamePath = 'E:\\Games\\Overwatch\\Overwatch'
const visitedBackgrounds = [
  '184', // Removed
  '661', // Tutorial map clipped
  '688', // Practice range clipped
  '6B3', // Removed
  '6C7', // NOTE: Hazard on green screen
  '6C9', // Junkenstein's Revenge clipped
  '807', // White gradient background
  '862', // Inside hexagon sphere
  '871', // Rialto clipped
  '92D', // Platform on black screen
  'A7A', // Busan clipped
  'D4C', // Green screen bad angles
  'D53', // Esperanca clipped
  'EB2', // Runasapi clipped
  'EC0', // Samoa clipped
  'EF0', // Ocean clipped
  'FF7', // Hero Mastery side view
  'FFF', // Default background
  '1018', // NOTE: Default background (triangular tiles)
  '10D6', // Dark Ice fields
  '1128', // Dark Sky
  '1157', // NOTE: Hanaoka Fly-by, clips into rock for a bit
  '1160', // Throne of Anubis bad angles
  '11AD', // Removed
  '1207', // Underneath hero mastery
  '1216', // Light blue gradient
  '123F', // White empty with grid base
  '1276', // Was Juno is now squished OWCS
  '12B9', // Overwatch Classic not shaded
  '12BA', // Overwatch Classic draft
  '1318' // White square in sky
]

// Paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataToolPath = path.join(__dirname, '../toolchain-release/DataTool.exe')
const backgroundsFile = path.join(__dirname, '../src-tauri/src/backgrounds.rs')

// Function to run the DataTool.exe and capture its output
function runDataTool(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `"${dataToolPath}" "${gamePath}" list-maps`,
      (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`)
        }
        if (stderr) {
          reject(`Stderr: ${stderr}`)
        }
        resolve(stdout)
      }
    )
  })
}

function normalizeId(id: string): string {
  return id.replace(/^0+/, '') // Remove leading zeros
}

// Function to extract IDs from backgrounds.rs
async function extractBackgroundIds(
  backgroundsFile: string
): Promise<string[]> {
  const content = await readFile(backgroundsFile, 'utf-8')
  const idRegex = /^\s*(?:\/\/\s*)?id: "0x[0-9A-Fa-f]+",/gm
  const matches = content.match(idRegex)

  if (!matches) {
    return []
  }

  return matches
    .map((idLine) => {
      const match = idLine.match(/0x[0-9A-Fa-f]+/)
      return match ? match[0].slice(-4) : null
    })
    .filter((id) => id !== null)
    .map((id) => normalizeId(id))
}

function extractMapIds(output: string): { id: string; name: string }[] {
  const mapIdRegex = /^([^\n:]+):\s*([0-9A-Fa-f]{3,4})\s*\(/gm
  const matches = [...output.matchAll(mapIdRegex)]

  return matches.map((match) => ({
    name: match[1].trim(), // Capture the map name (everything before the colon)
    id: match[2] // Capture the map ID (3 or 4 hex characters)
  }))
}

// Main function to run the process
try {
  console.log('Syncing backgrounds...')

  // Step 1: Run DataTool.exe
  const toolOutput = await runDataTool()
  console.log('DataTool output:\n', toolOutput)

  // Step 2: Extract background IDs
  const backgroundIds = await extractBackgroundIds(backgroundsFile)
  console.log('Existing Background IDs', backgroundIds)

  // Step 3: Extract map IDs from DataTool output
  const mapData = extractMapIds(toolOutput)
  const mapIds = mapData.map((data) => data.id)
  console.log('Collected Background IDs', mapIds)
  console.log(
    'Map names',
    mapData.map((data) => data.name)
  )

  // Step 4: List extra IDs in DataTool output that are not in backgrounds.rs
  const extraIds = mapData.filter(
    ({ id }) => !backgroundIds.includes(id) && !visitedBackgrounds.includes(id)
  )

  if (extraIds.length > 0) {
    const extraIdOutput = extraIds
      .map(({ id, name }) => `${id} (${name})`)
      .join('\n')
    console.log(
      `IDs in DataTool output but not in backgrounds.rs:\n${extraIdOutput}\n`
    )
  } else {
    console.log('All IDs from DataTool output are present in backgrounds.rs.\n')
  }

  // Step 5: Compare IDs and find IDs in backgroundIds but not in mapIds
  const missingIds = backgroundIds.filter((id) => !mapIds.includes(id))

  if (missingIds.length > 0) {
    console.log(
      `IDs in backgrounds.rs but not in DataTool output: ${missingIds.join(', ')}.`
    )
  } else {
    console.log('All IDs from backgrounds.rs are present in DataTool output.')
  }
} catch (error) {
  console.error(`Error: ${error}`)
}
