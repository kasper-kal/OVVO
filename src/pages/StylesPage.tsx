import { PageHeader } from '../components/layout/AppShell';
import { StyleSettings } from '../components/ui/StyleSettings';
import { useT } from '../lib/useT';

/**
 * **Styles has a screen of its own.**
 *
 * It lived inside Settings for one round and that was wrong for the reason Settings is a list:
 * fifty previews in the middle of it turn two short columns into a wall, and every other setting
 * ends up below the fold behind a grid of pictures. A look is a thing you go and choose, the way
 * the colour screens were opened from a row; this page is that row's destination.
 *
 * The picker itself is still `ui/StyleSettings`, so the grid, the Background switch and the
 * photograph rules are written once and this page only gives them somewhere to stand.
 */
export function StylesPage() {
  const t = useT();

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Styles')}
        description={t('Pick a look. Every one is checked for readability.')}
        showTitle
      />
      <StyleSettings />
    </div>
  );
}
