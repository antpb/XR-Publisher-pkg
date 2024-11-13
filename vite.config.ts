import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import glsl from 'vite-plugin-glsl';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    glsl(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'XRPublisher',
      formats: ['es', 'umd', 'cjs'],
      fileName: (format) => `xr-publisher.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'three',
        'get-browser-rtc',
        'events',
        'process',
        'stream',
        'util',
        'buffer'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          three: 'THREE',
          'get-browser-rtc': 'getBrowserRTC'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.glb') || 
              assetInfo.name?.endsWith('.vrm') || 
              assetInfo.name?.endsWith('.glsl') ||
              assetInfo.name?.endsWith('.wasm') ||
              assetInfo.name?.endsWith('.fbx')) {
            const parts = assetInfo.name.split('/');
            const filename = parts[parts.length - 1];
            return `assets/${filename}`;
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'get-browser-rtc': resolve(__dirname, './src/shims/get-browser-rtc.ts'),
      '../types/three-components': resolve(__dirname, './src/types/three-components.d.ts'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vrm']
  },
  assetsInclude: [
    '**/*.glb', 
    '**/*.vrm', 
    '**/*.fbx', 
    '**/*.wasm', 
    '**/*.glsl',
    '**/avatars/*.vrm'
  ],
  optimizeDeps: {
    include: ['../types/three-components'],
    exclude: ['@react-three/fiber', 'get-browser-rtc']
  }
});