import * as fs from 'fs'
import readlineSync from 'readline-sync'
import * as semver from 'semver'

interface PackageJson {
  version: string
}

const packageJsonPath = './package.json'
const cargoTomlPath = './src-tauri/Cargo.toml'
const readmePath = './README.md'

async function updateVersion(type: string) {
  // Read package.json and Cargo.toml
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf8')
  ) as PackageJson
  const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8')

  // Get current version from package.json
  const currentVersion = packageJson.version
  console.log(`Current version: ${currentVersion}`)

  // Determine new version
  let newVersion = ''
  if (['patch', 'minor', 'major'].includes(type)) {
    newVersion = semver.inc(currentVersion, type)!
  } else {
    newVersion = type // Custom version
  }

  // Ask for confirmation
  if (!semver.valid(newVersion)) {
    console.log(
      'Invalid version number. Please provide a valid semver version or "patch", "minor", or "major".'
    )
    return
  }
  console.log(`New version: ${newVersion}`)

  if (
    !readlineSync.keyInYN(`Are you sure you want to update to ${newVersion}?`)
  ) {
    console.log('Version update cancelled.')
    return
  }

  // Update package.json
  packageJson.version = newVersion
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

  // Update Cargo.toml
  const updatedCargoToml = cargoToml.replace(
    /version = ".*"/,
    `version = "${newVersion}"`
  )
  fs.writeFileSync(cargoTomlPath, updatedCargoToml)

  // Update README.md
  const readmeContent = fs.readFileSync(readmePath, 'utf8')
  const updatedReadme = readmeContent.replace(
    /Version: .*?(\s|<.*|$)/,
    `Version: ${newVersion}$1`
  )
  fs.writeFileSync(readmePath, updatedReadme, 'utf8')

  console.log(`Version updated to ${newVersion} successfully!`)
}

// Get version type from command line argument
const versionType = process.argv[2]
updateVersion(versionType).catch(console.error)
