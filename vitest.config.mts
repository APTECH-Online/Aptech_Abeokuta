import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside the Next.js server bundle; tests run in plain Node.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true
  }
})
