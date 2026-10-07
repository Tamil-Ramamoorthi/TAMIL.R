import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Production Vite configuration.
 *
 * `base` stays configurable: set VITE_BASE at build time when deploying under
 * a sub-path (e.g. a GitHub Pages project site). Every runtime asset path goes
 * through src/config/assets.ts, which prefixes `import.meta.env.BASE_URL`, so
 * changing the base never breaks asset loading.
 */
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE ?? '/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    host: true,
  },

  preview: {
    port: 4173,
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode !== 'production',
    cssCodeSplit: true,
    // GLB / HDR files must never be inlined as base64.
    assetsInlineLimit: 2048,
    /**
     * The three.js + R3F vendor chunk is ~1 MB and that is expected. It is
     * lazily imported by the hero scene, so it never touches first paint —
     * the initial payload is React + GSAP + app code only.
     */
    chunkSizeWarningLimit: 1200,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        /**
         * Split the heavy vendors into their own chunks so the first paint only
         * pays for React + GSAP; three.js and the R3F layer arrive with the
         * lazily-imported WebGL scene.
         *
         * Written as a function rather than the object form so it is valid for
         * both the Rollup and Rolldown bundler backends.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;

          // Module ids arrive with OS-native separators on Windows.
          const path = id.replace(/\\/g, '/');
          const inPackage = (name: string) =>
            path.includes(`/node_modules/${name}/`);

          if (
            inPackage('react') ||
            inPackage('react-dom') ||
            inPackage('scheduler')
          ) {
            return 'vendor-react';
          }
          if (inPackage('three')) return 'vendor-three';
          if (inPackage('@react-three/fiber')) return 'vendor-r3f';
          if (inPackage('gsap') || inPackage('@gsap/react')) {
            return 'vendor-gsap';
          }

          // Everything else (drei helpers, loaders) is left to the bundler so
          // it can stay in whichever lazy chunk actually needs it.
          return undefined;
        },
      },
    },
  },

  // Pre-bundle the heavy 3D deps so dev-server navigation stays snappy.
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'gsap'],
  },

  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr', '**/*.exr'],
}));
