import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**']
    }
  },
  envPrefix: [
    'VITE_',
    'TAURI_PLATFORM',
    'TAURI_ARCH',
    'TAURI_FAMILY',
    'TAURI_PLATFORM_VERSION',
    'TAURI_PLATFORM_TYPE',
    'TAURI_DEBUG'
  ],
  build: {
    // // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? ('esbuild' as const) : false,
    // // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG
  },
  define: {
    'import.meta.env.REPOSITORY_URL': JSON.stringify(
      process.env.npm_package_repository
    ),
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(
      process.env.npm_package_version
    )
  }
}))
