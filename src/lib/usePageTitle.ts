import { useEffect } from 'react';

const APP_NAME = 'OVVO';

/*
 * The name of the screen in the tab, the history and a bookmark.
 *
 * The app used to leave `document.title` at its own name on every route: ten open tabs could not
 * be told apart, an alert's page had nothing in the tab that named the alert (8.6), a journey
 * looked like the results list (9.8), and a 404 looked like Home (12.4). A page passes the name it
 * is showing; the shell's fixed names cover the rest.
 */
export function usePageTitle(title?: string | null): void {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      /* Leave the shell's own name in place while the next screen mounts and sets its own. */
      if (document.title !== `${title} · ${APP_NAME}`) return;
      document.title = previous;
    };
  }, [title]);
}
