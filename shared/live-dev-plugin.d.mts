import type { Plugin } from 'vite';

/** Development only: answers `/api/live` with the real feed, through the worker's own reader. */
declare const liveFeedPlugin: () => Plugin;
export default liveFeedPlugin;
