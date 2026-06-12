# Contributing

Thanks for your interest in OverBuddy. This project is a Windows Tauri desktop app with a React/Vite frontend and a Rust backend.

## Prerequisites

- Windows for full local development and MSI builds. Some Rust code uses Windows-only APIs, and the configured bundle target is `msi`.
- Node.js `>=22.12.0`, matching the `engines` field in `package.json`.
- Rust, using a recent stable toolchain that satisfies `src-tauri/Cargo.toml`.
- Tauri's Windows system dependencies. See the official Tauri prerequisites guide: https://v2.tauri.app/start/prerequisites/

## Install pnpm

This repo pins pnpm with the `packageManager` field in `package.json`.

The recommended setup is Corepack:

```powershell
npm install --global corepack@latest
corepack enable pnpm
corepack prepare pnpm@11.6.0 --activate
pnpm --version
```

You can also install pnpm directly on Windows:

```powershell
winget install -e --id pnpm.pnpm
```

pnpm installation docs: https://pnpm.io/installation

## Install dependencies

From the repository root:

```powershell
pnpm install
```

CI uses a stricter install:

```powershell
pnpm install --frozen-lockfile --strict-peer-dependencies
```

Use the stricter command when you want to reproduce CI behavior exactly.

## Validate the app

Run the full validation command before opening a PR:

```powershell
pnpm validate
```

This runs:

- `pnpm validate:frontend`: TypeScript, production Vite build, ESLint, and formatting checks.
- `pnpm validate:rust`: Rust formatting and Clippy with warnings treated as errors.

You can run either half directly while iterating:

```powershell
pnpm validate:frontend
pnpm validate:rust
```

## Run in Tauri dev

From the repository root:

```powershell
pnpm tauri dev
```

The Tauri config starts the Vite dev server automatically through `beforeDevCommand`, so you do not need to start Vite separately.

## Build the app

From the repository root on Windows:

```powershell
pnpm tauri build
```

The current Tauri bundle target is MSI. Build outputs are written under:

```text
src-tauri/target/release/bundle/
```

For Windows installer details, see the Tauri Windows installer docs: https://v2.tauri.app/distribute/windows-installer/

## Updater signing

The project is configured to create Tauri updater artifacts:

- `src-tauri/tauri.conf.json` has `bundle.createUpdaterArtifacts` set to `"v1Compatible"`.
- `src-tauri/tauri.conf.json` also contains the updater public key at `plugins.updater.pubkey`.
- `.github/workflows/create-release.yml` passes these secrets to the Tauri release build:
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

These values sign the updater artifacts so the app can verify that future updates came from the trusted private key. This is not the same thing as Windows Authenticode code signing. The app is still distributed as an unsigned Windows installer unless a separate Windows code-signing certificate/signing setup is added.

Tauri updater signing docs: https://v2.tauri.app/plugin/updater/#signing-updates

### Generate a signing key

If you need to create a new updater signing key:

```powershell
pnpm tauri signer generate -- -w "$HOME\.tauri\overbuddy.key"
```

The command prints a public key. Put that public key in `src-tauri/tauri.conf.json` at `plugins.updater.pubkey`.

Keep the private key secret. Anyone with the private key can sign updates accepted by installed apps.

### Build locally with updater signing

Set the signing environment variables in the same PowerShell session before building:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY="$HOME\.tauri\overbuddy.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="your-key-password"
pnpm tauri build
```

`TAURI_SIGNING_PRIVATE_KEY` can be either the private key content or a path to the private key file. `.env` files are not used for this by Tauri; the values must be available in the build environment.

### Configure GitHub release secrets

In the GitHub repository settings, add these Actions secrets for the `release` environment used by `.github/workflows/create-release.yml`:

- `TAURI_SIGNING_PRIVATE_KEY`: the private key content, or the private key value expected by the release runner.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the password used when generating the key. If the key has no password, store an empty value only if GitHub/environment policy allows it; otherwise update the workflow accordingly.

If the updater private key is lost, existing installed apps cannot be updated with a newly generated key unless they first receive an update signed by the old key that changes the public key.

Tauri environment variable reference: https://v2.tauri.app/reference/environment-variables/
