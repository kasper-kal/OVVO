/**
 * The review layer's batch folder, injected by `vite.config.ts`.
 *
 * The dev server picks one folder under `review/` per run (`desktop` by default, `mobile` when the
 * run says so) and the same name has to reach both halves: the middleware that writes the files and
 * the panel that says where they went. The middleware gets it as an option; the browser gets it as
 * this constant, substituted at build time from the same value.
 *
 * It is declared here rather than in a `.ts` import because it is not a module export: `define`
 * replaces the identifier `__REVIEW_BATCH__` wherever it appears, so the import would have nothing
 * to import. A build that did not define it would leave the identifier here, which is why the one
 * read of it in `ReviewLayer.tsx` is guarded with `typeof` before it is used.
 */
declare const __REVIEW_BATCH__: string;
