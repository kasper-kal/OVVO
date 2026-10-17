import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
/*
 * The review layer's upload endpoint (see `review/`). It writes pasted screenshots and their notes
 * into `review/` while the dev server runs, and `apply: 'serve'` keeps it out of every build. It is
 * plain JavaScript with its own two-line declaration so this project does not need `@types/node`
 * for a tool that is going to be deleted.
 */
import reviewUpload, { reviewBatchName } from './review/upload-plugin.mjs';

// The config runs in Node, where `process` exists but is not in the browser typings.
declare const process: { env: Record<string, string | undefined> };

// Vite blocks requests whose Host header is not localhost/an IP. The private
// preview hostname changes whenever the workspace is restored, so it is injected
// at launch (see scripts/dev-preview.sh) instead of being written into the repo.
const previewHost = process.env.PREVIEW_HOST;
const allowedHosts = previewHost ? [previewHost] : undefined;

/*
 * Which batch the review layer saves into.
 *
 * The phone round is finished and archived in `review/mobile/`; the desktop round starts in
 * `review/desktop/`, which is where a capture goes unless the run says otherwise. The name is
 * chosen once, here, and handed to both halves: the middleware that writes the files and the
 * browser layer that says where they went (`__REVIEW_BATCH__` below) — so the label on the Save
 * button cannot name a different folder from the one the picture lands in.
 *
 *   REVIEW_BATCH=mobile npm run dev      writes to review/mobile/ again
 *   npm run dev                          writes to review/desktop/
 */
const reviewBatch = reviewBatchName();

export default defineConfig({
  define: {
    __REVIEW_BATCH__: JSON.stringify(reviewBatch),
  },
  plugins: [react(), reviewUpload({ batch: reviewBatch })],
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
