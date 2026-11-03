import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.littlejazzroom.app',
  appName: 'Little Jazz Room',
  webDir: 'dist',
  // No remote server URL: bundle the local Vite build for offline launch.
  // Normal web hosting and React Router remain unchanged.
};

export default config;
