/**
 * Dev-only upload endpoint for the review layer.
 *
 * The point of it: a screenshot you paste into the layer should land in `review/` without you
 * touching a file manager. Vite's dev server is the only thing running, so the write happens here —
 * `apply: 'serve'` means this middleware does not exist in a build, and deleting this folder
 * deletes the whole feature.
 *
 * Two files per upload:
 *   review/<stamp>-<route>-<width>-<theme>.png   the picture, as pasted
 *   review/notes.json                           one entry per picture, appended
 *
 * The image must be a png/jpeg/webp data URL and is capped at 12 MB, because this is a review tool
 * on localhost and not a file server.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 12 * 1024 * 1024;

/** Anything the URL bar or a path can contain, reduced to a filename that cannot escape the folder. */
function safeName(value, fallback) {
  const cleaned = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

export default function reviewUpload() {
  const dir = join(process.cwd(), 'review');

  return {
    name: 'ovvo-review-upload',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__review', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('allow', 'POST');
          res.end('POST only');
          return;
        }

        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('error', () => {
          res.statusCode = 400;
          res.end('Could not read the request body');
        });
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(body.image ?? '');
            if (!match) throw new Error('image must be a png, jpeg or webp data URL');

            const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
            const bytes = Buffer.from(match[2], 'base64');
            if (bytes.byteLength > MAX_BYTES) throw new Error('image is larger than 12 MB');

            mkdirSync(dir, { recursive: true });
            /* Two notes from the same route at the same width a second apart must not overwrite
               each other, and the notes file would otherwise list the same image twice. */
            const stem = safeName(body.name, 'shot');
            let image = `${stem}.${extension}`;
            for (let n = 2; existsSync(join(dir, image)); n += 1) image = `${stem}-${n}.${extension}`;
            writeFileSync(join(dir, image), bytes);

            const notesPath = join(dir, 'notes.json');
            const notes = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, 'utf8')) : [];
            if (!Array.isArray(notes)) throw new Error('review/notes.json is not an array');
            notes.push({
              image,
              ...body.meta,
              pins: Array.isArray(body.pins) ? body.pins : [],
              regions: Array.isArray(body.regions) ? body.regions : [],
            });
            writeFileSync(notesPath, `${JSON.stringify(notes, null, 2)}\n`);

            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, image }));
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(error?.message ?? error) }));
          }
        });
      });
    },
  };
}
