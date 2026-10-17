import { useCallback } from 'react';
import { useApp } from '../state/AppState';
import { translate } from './i18n';

/**
 * The interface text, in the language chosen in Settings.
 *
 * The key *is* the English sentence (see `lib/i18n`), so a call site reads
 * `t('Plan a journey')` and needs no separate vocabulary. Returns a stable function per
 * language, so it can sit in a dependency array without churning the tree.
 */
export function useT() {
  const { settings } = useApp();
  const language = settings.language;
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );
}
