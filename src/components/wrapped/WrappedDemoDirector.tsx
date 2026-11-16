import { Link } from 'react-router-dom';
import { Button, Dialog } from '../ui/primitives';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import { DEMO_VARIANTS, type DemoVariant } from '../../lib/wrappedDemo';
import type { Chapter } from '../../lib/wrappedDeck';

/*
 * **The demo is a workshop, not a secret URL.**
 *
 * A fixed demo year is good for showing the finished story and bad for making it: every change to
 * page nine meant swiping through eight chapters first. This panel turns the demo into a chapter
 * strip, a scenario switch and one honest way back to the real gate. It only exists behind
 * `?demo=1`, so a traveller's own Wrapped never grows a developer control.
 */
export function WrappedDemoDirector({
  open,
  onClose,
  story,
  index,
  variant,
  onJump,
  onVariant,
}: {
  open: boolean;
  onClose: () => void;
  story: Chapter[];
  index: number;
  variant: DemoVariant;
  onJump: (index: number) => void;
  onVariant: (variant: DemoVariant) => void;
}) {
  const t = useT();
  const { settings } = useApp();
  /* `useT` is already language-aware; the labels come from the demo table. */
  const label = (item: (typeof DEMO_VARIANTS)[number]) =>
    settings.language === 'nl' ? item.labelNl : item.label;

  return (
    <Dialog
      open={open}
      title={t('Demo Director')}
      description={t('Jump to any chapter or switch the demo year. The real Yearbook gate is unchanged.')}
      onClose={onClose}
      panelClassName="wrapped-director"
      footer={
        <>
          <Link className="btn btn--ghost" to="/yearbook" onClick={onClose}>
            {t('See the real gate')}
          </Link>
          <Button variant="ghost" onClick={onClose}>
            {t('Close')}
          </Button>
        </>
      }
    >
      <div className="wrapped-director__section">
        <span className="wrapped-director__label">{t('Demo year')}</span>
        <div className="wrapped-director__choices">
          {DEMO_VARIANTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="wrapped-director__choice"
              aria-pressed={item.id === variant}
              onClick={() => onVariant(item.id)}
            >
              {label(item)}
            </button>
          ))}
        </div>
      </div>

      <div className="wrapped-director__section">
        <div className="between">
          <span className="wrapped-director__label">{t('Chapters')}</span>
          <span className="t-sm t-muted">
            {index + 1} / {story.length}
          </span>
        </div>
        <div className="wrapped-director__grid">
          {story.map((chapter, at) => (
            <button
              key={chapter.id}
              type="button"
              className="wrapped-director__chapter"
              aria-current={at === index ? 'page' : undefined}
              onClick={() => onJump(at)}
            >
              <span>{String(at + 1).padStart(2, '0')}</span>
              <strong>{t(chapter.kicker)}</strong>
              <em>{chapter.big}</em>
            </button>
          ))}
        </div>
      </div>

      <p className="t-sm t-muted">{t('The demo year is made up in memory and never written to your tally.')}</p>
    </Dialog>
  );
}
