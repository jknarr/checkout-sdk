import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DemoCheckout',
      fileName: 'demo-checkout',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
    },
  },
  plugins: [dts({ insertTypesEntry: true, rollupTypes: true })],
});
