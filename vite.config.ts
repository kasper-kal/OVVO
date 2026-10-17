import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The config runs in Node, where `process` exists but is not in the browser typings.
declare const process: { env: Record<string, string | undefined> };

// Vite blocks requests whose Host header is not localhost/an IP. The private
// preview hostname changes whenever the workspace is restored, so it is injected
// at launch (see scripts/dev-preview.sh) instead of being written into the repo.
const previewHost = process.env.PREVIEW_HOST;
const allowedHosts = previewHost ? [previewHost] : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    allowedHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts,
  },
});
