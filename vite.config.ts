import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Settings src/lib/env.ts reads as literal process.env.NEXT_PUBLIC_* — the same text
// Next.js inlines. Until the stage 6 rename, .env files use VITE_* names, so each value
// falls back to its VITE_* twin (next.config.ts does the same).
const ENV_NAMES = [
  'API_BASE_URL',
  'GOOGLE_CLIENT_ID',
  'APPLE_SERVICE_ID',
  'APPLE_REDIRECT_URI',
  'TELEGRAM_BOT',
  'TELEGRAM_OPENID_CLIENT_ID',
  'TELEGRAM_OPENID_REDIRECT_URI',
  'REVERB_APP_KEY',
  'REVERB_HOST',
  'REVERB_PORT',
  'REVERB_SCHEME',
]

export default defineConfig(({ mode }) => {
  const files = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_'])
  const define: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  }
  for (const n of ENV_NAMES) {
    define[`process.env.NEXT_PUBLIC_${n}`] = JSON.stringify(files[`NEXT_PUBLIC_${n}`] ?? files[`VITE_${n}`] ?? '')
  }
  return {
    plugins: [react(), tailwindcss()],
    define,
    // inline (empty) PostCSS config: stops Vite picking up postcss.config.mjs, which is
    // for the Next.js build — Tailwind runs here through @tailwindcss/vite
    css: { postcss: {} },
  }
})
