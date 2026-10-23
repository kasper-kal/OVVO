import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
/*
 * The review layer's upload endpoint (see `review/`). It writes pasted screenshots and their notes
 * into `review/` while the dev server runs, and `apply: 'serve'` keeps it out of every build. It is
 * plain JavaScript with its own two-line declaration so this project does not need `@types/node`
 * for a tool that is going to be deleted.
 */
import reviewUpload, { reviewBatchName } from './review/upload-plugin.mjs';

// The config runs in Node, where `process` exists but is not in the browser typings.
declare const process: {
  env: Record<string, string | undefined>;
  /* Read for `loadEnv`, which resolves `.env.local` from the project root. */
  cwd: () => string;
};

/*
 * Vite blocks requests whose Host header is not localhost/an IP — the private preview hostname
 * (`pv-<id>.style.dev`) is not localhost, so a browser opening the preview gets
 * *"Blocked request. This host is not allowed"* and the page never loads.
 *
 * The hostname is **not written into this repo**: it changes whenever the workspace is restored,
 * and a stale hostname in a tracked file is a bug for the next person. It arrives one of two ways,
 * in this order:
 *
 *   1. `PREVIEW_HOST=pv-<id>.style.dev` in the environment, which is what `scripts/dev-preview.sh`
 *      sets for a one-off launch;
 *   2. `PREVIEW_HOST=` in `.env.local`, which Vite loads itself and `.gitignore` excludes (`*.local`)
 *      — so a restored workspace needs one untracked line and then plain `npm run dev` works.
 *
 * Only this one variable is read out of the env file, and only for the server's allow-list: no
 * prefix-free env is handed to the client bundle.
 */
const previewHostFromEnv = (mode: string) =>
  process.env.PREVIEW_HOST || loadEnv(mode, process.cwd(), '').PREVIEW_HOST;

/*
 * The addresses this app is *served* from, which Vite must also allow.
 *
 * `vite preview` runs the built app on Render, and it validates the Host header exactly as the
 * dev server does — so the live site answered **"Blocked request. This host is not allowed"**
 * until its own address was named. That address is stable (the Render service's name sets it),
 * so unlike the private preview hostname it can be written here.
 *
 * `RENDER_EXTERNAL_HOSTNAME` is set by Render itself, so a preview deploy of a pull request —
 * served from `ovvo-pr-<n>.onrender.com` — needs no edit to this file. `ALLOWED_HOSTS` takes a
 * comma-separated list for anywhere else. Nothing here weakens the check: each host is named, and
 * the allow-list is never `true`, which would accept any Host header a stranger sends.
 */
const hostAllowlist = ['ovvo.onrender.com'];

const hostsFromList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter((host) => host.length > 0);

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

export default defineConfig(({ mode }) => {
  const previewHost = previewHostFromEnv(mode);
  const allowedHosts = [
    previewHost,
    process.env.RENDER_EXTERNAL_HOSTNAME,
    ...hostsFromList(process.env.ALLOWED_HOSTS),
    ...hostAllowlist,
  ].filter((host): host is string => Boolean(host));

  /* `undefined` leaves Vite's own rule in place (localhost and IP addresses only). */
  const allowlist = allowedHosts.length > 0 ? allowedHosts : undefined;

  return {
    define: {
      __REVIEW_BATCH__: JSON.stringify(reviewBatch),
    },
    plugins: [react(), reviewUpload({ batch: reviewBatch })],
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: false,
      allowedHosts: allowlist,
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: allowlist,
    },
  };
});
