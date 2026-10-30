import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Card, Field, Segmented } from './primitives';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import {
  STYLES,
  STYLE_GROUPS,
  styleById,
  stylePalette,
  stylePhotograph,
  stylePhotoPath,
  stylePhotoStatus,
  styleShape,
} from '../../lib/styles';

/**
 * **The style picker.**
 *
 * Two blocks, in this order: the look you are wearing (its three colours, its name, and the
 * Photograph/Colour switch when it has a picture), then the catalogue as small swatches.
 *
 * What the first version got wrong, and this one fixes: it was fifty large tiles, each showing a
 * pretend card and its name *set in that style's own display face*, with a sentence under every
 * group heading. Fifty posters with fifty different typefaces, one after another, is not a
 * catalogue — it is noise, and it made a long page look longer. The swatches are small now and the
 * names are all in the interface's own font, so the only thing that changes from tile to tile is
 * the colour, which is what the tile is for.
 *
 * Photo styles carry one extra control, **Background**: the photograph, or that style's own colour.
 * The answer is remembered per style, and the saving modes win — at 10% of a battery, or on a device
 * that measured as slow, the picture is not drawn whatever the switch says, and the sentence under
 * it says why instead of quietly disagreeing with itself.
 */
export function StyleSettings() {
  const { settings, appearance, power, updateSettings } = useApp();
  const t = useT();
  const dutch = settings.language === 'nl';

  const current = styleById(settings.styleId);
  const palette = stylePalette(current, appearance);
  const picture = stylePhotograph(current);
  const savingMode = power.mode === 'super';
  const photographChosen = !settings.photoColourOnly.includes(current.id);

  /*
   * **What is drawn, not what was asked for.** The row used to read "Photograph" while the folder
   * held nothing and the app painted the colour. The painting code already probes the file, so its
   * answer is read here and the row speaks from it.
   */
  const [photoStatus, setPhotoStatus] = useState<'present' | 'missing' | 'unknown'>(
    () => stylePhotoStatus.get(current.id) ?? 'unknown',
  );

  useEffect(() => {
    if (!picture) {
      setPhotoStatus('missing');
      return undefined;
    }
    const known = stylePhotoStatus.get(current.id);
    if (known) {
      setPhotoStatus(known);
      return undefined;
    }
    let live = true;
    setPhotoStatus('unknown');
    const probe = new Image();
    probe.onload = () => {
      stylePhotoStatus.set(current.id, 'present');
      if (live) setPhotoStatus('present');
    };
    probe.onerror = () => {
      stylePhotoStatus.set(current.id, 'missing');
      if (live) setPhotoStatus('missing');
    };
    probe.src = stylePhotoPath(current.id);
    return () => {
      live = false;
    };
  }, [current.id, picture]);

  /*
   * **One control, so it moves like one.** It is announced as a radio group, and a group of radios
   * answers the arrow keys. Selection follows focus, because choosing is instant; Tab enters at the
   * chosen tile and leaves from it instead of walking through fifty buttons.
   */
  const ordered = STYLE_GROUPS.flatMap((group) => STYLES.filter((style) => style.group === group.id));
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveTo = (index: number) => {
    const bounded = (index + ordered.length) % ordered.length;
    updateSettings({ styleId: ordered[bounded].id });
    tileRefs.current[bounded]?.focus();
  };

  const onTileKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: ordered.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    moveTo(moves[event.key]);
  };

  const name = (style: { name: string; nameNl: string }) => (dutch ? style.nameNl : style.name);

  const setBackground = (next: 'photo' | 'colour') => {
    if (!picture) return;
    const off = new Set(settings.photoColourOnly);
    if (next === 'photo') off.delete(current.id);
    else off.add(current.id);
    updateSettings({ photoColourOnly: [...off] });
  };

  return (
    <div className="style-picker">
      <Card className="style-current">
        <div className="style-current__head">
          <span className="style-current__swatches" aria-hidden="true">
            <span style={{ background: palette.canvas }} />
            <span style={{ background: palette.card }} />
            <span style={{ background: palette.accent }} />
          </span>
          <span className="style-current__label">
            <span className="t-faint t-sm">{t('In use')}</span>
            <span className="style-current__name">{name(current)}</span>
          </span>
        </div>

        {picture && savingMode && (
          <p className="field__hint">
            {t('Saving battery, so this style draws its colour. The photograph comes back above 10%.')}
          </p>
        )}

        {picture && !savingMode && photoStatus === 'present' && (
          <Field
            label={t('Background')}
            hint={
              photographChosen
                ? t('This style uses its picture.')
                : t('This style draws its own colour instead of its picture.')
            }
          >
            <Segmented
              ariaLabel={t('Background')}
              value={photographChosen ? 'photo' : 'colour'}
              onChange={(value) => setBackground(value as 'photo' | 'colour')}
              options={[
                { value: 'photo', label: t('Photograph') },
                { value: 'colour', label: t('Colour') },
              ]}
            />
          </Field>
        )}

      </Card>

      <div className="style-list" role="radiogroup" aria-label={t('Styles')}>
        {STYLE_GROUPS.map((group) => {
          const members = STYLES.filter((style) => style.group === group.id);
          if (members.length === 0) return null;
          return (
            <div className="style-group" key={group.id}>
              {/* A shelf under the page's own `h1`: this was `h3`, so the outline jumped a level. */}
              <h2 className="style-group__title">{dutch ? group.labelNl : group.label}</h2>
              <div className="style-grid">
                {members.map((style) => {
                  const colours = stylePalette(style, appearance);
                  const selected = style.id === current.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      ref={(node) => {
                        tileRefs.current[ordered.findIndex((item) => item.id === style.id)] = node;
                      }}
                      onKeyDown={(event) => {
                        const position = ordered.findIndex((item) => item.id === style.id);
                        onTileKeyDown(event, position);
                      }}
                      className="style-tile"
                      data-selected={selected ? 'true' : undefined}
                      onClick={() => updateSettings({ styleId: style.id })}
                    >
                      {/*
                        Three bands: the page, a card on it, and the accent. The accent used to be
                        a 7px dot, which is why a style called Navy and Gold looked like Navy: the
                        gold was there, at the size of a full stop.
                      */}
                      {/* The swatch is cut to the style's own shape, so the catalogue shows the geometry and not only the colours. */}
                      <span
                        className="style-tile__swatch"
                        aria-hidden="true"
                        style={{
                          borderRadius: Math.min(20, Math.round(9 * styleShape(style).scale)),
                          borderWidth: styleShape(style).line,
                        }}
                      >
                        <span style={{ background: colours.canvas }} />
                        <span style={{ background: colours.card }} />
                        <span style={{ background: colours.accent }} />
                      </span>
                      <span className="style-tile__name">{name(style)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
