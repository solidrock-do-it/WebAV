import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [dts({ rollupTypes: true }), externalizeDeps()],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/av-recorder.ts'),
      name: 'av-recorder',
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul', // or 'c8'
    },
  },
});
