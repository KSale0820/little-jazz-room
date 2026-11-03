import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  // Separate, unlinked engineering test page. Does not modify React routes.
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        nativeAudioLab: resolve(import.meta.dirname, 'native-audio-lab.html'),
      },
    },
  },
});
