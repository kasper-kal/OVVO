/**
 * Types for `upload-plugin.mjs`.
 *
 * The plugin is plain JavaScript on purpose: it touches `node:fs`, this project has no
 * `@types/node`, and a review tool that is going to be deleted is not a reason to add a typing
 * dependency. Two lines of declaration are enough for `vite.config.ts` to import it and for `tsc`
 * to check the config.
 */
import type { Plugin } from 'vite';

/** Which folder under `review/` this run's captures are written to (`desktop` unless chosen). */
export function reviewBatchName(requested?: string): string;

export default function reviewUpload(options?: { batch?: string }): Plugin;
