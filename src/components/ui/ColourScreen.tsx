import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './primitives';
import { FullScreen } from './FullScreen';
import { Icon } from './Icons';
import { useT } from '../../lib/useT';
import { clamp, hexToHsv, hsvToHex, inkFor, readHex, type Hsv } from '../../lib/colour';

/**
 * **Choosing a colour, as a screen rather than a sheet.**
 *
 * This is the old `ColorPicker` dialog, promoted (`COLOURS_PLAN.md` §4a). The reasons were measured
 * rather than argued: the sheet's body was 918px in a 968px panel with its **Done** button below the
 * fold at 1440, and a 900px body in a 743px panel at 390. A form whose commit button is off screen
 * is a form that has to be scrolled to be finished, on the one surface a traveller opens for a
 * two-second decision.
 *
 * So the three answers a phone's picker gives stay — **a grid**, **a spectrum**, **a value you type**
 * — and they move into a screen with a back arrow and **Done in the header**. Done is then on screen
 * at every width and every scroll position, and the body is free to be as long as the colour needs.
 *
 * Two things are new here rather than moved:
 *
 *   • **the consequence of the choice**, stated under the swatch: the ink the cards will be given and
 *     its measured ratio, asked of `lib/background.ts` rather than guessed, so the screen cannot
 *     promise a readable widget the app then draws differently;
 *   • **From your photo**, a row rather than a picture. The photograph left settings in this redesign
 *     (it could only ever be a 200px band there), and the sampler now has a screen of its own. This
 *     row is the way to it, and it is absent when there is no photo — the one conditional in the
 *     screen, and it moves nothing else.
 *
 * A sheet is not what was wrong with the old control: its **size** was. Nothing about the grid, the
 * pad, the hue strip, the hex field or the live write changed, and the ink is still derived rather
 * than chosen.
 */

export interface ColourScreenProps {
  open: boolean;
  /** The screen's title, e.g. "Background colour". */
  title: string;
  /** The colour in force, `#rrggbb` or a value the conversions can read. */
  value: string;
  /** The colours offered first, in the caller's order. Each must be `#rrggbb`. */
  swatches: readonly string[];
  /** Fires on every change — live while a finger is on the pad. */
  onChange: (hex: string) => void;
  onClose: () => void;
  /** The traveller's photo, when there is one. Adds the way to the sampler. */
  image?: string;
  /** Opens the photo screen; only used when `image` is set. */
  onPickFromPhoto?: () => void;
}

/** The colour at a point in the pad, as a fraction of its width and height. */
function atPoint(h: number, rect: DOMRect, x: number, y: number, fallback: number): Hsv {
  const s = clamp((x - rect.left) / rect.width, 0, 1);
  const v = 1 - clamp((y - rect.top) / rect.height, 0, 1);
  return { h, s, v: v === 0 ? fallback : v };
}

export function ColourScreen({
  open,
  title,
  value,
  swatches,
  onChange,
  onClose,
  image,
  onPickFromPhoto,
}: ColourScreenProps) {
  const t = useT();
  const padRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [draft, setDraft] = useState(value);
  const hexId = useId();

  /*
   * The value can change from outside the screen — a swatch in the row behind it, a reset, the photo
   * sampler — and the screen's own parts have to follow it. Re-derived only when the incoming value
   * really differs from what this screen is showing, so a drag is not interrupted by its own live
   * change coming back in as a prop.
   */
  useEffect(() => {
    const incoming = value.toLowerCase();
    if (incoming !== hsvToHex(hsv)) {
      setHsv(hexToHsv(incoming));
    }
    setDraft(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!open) return null;

  const commit = (next: Hsv) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setDraft(hex);
    onChange(hex);
  };

  const fromPointer = (event: { clientX: number; clientY: number }) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const next = atPoint(hsv.h, rect, event.clientX, event.clientY, hsv.v);
    commit(next);
  };

  const padKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    let { s, v } = hsv;
    if (event.key === 'ArrowLeft') s = clamp(s - step, 0, 1);
    else if (event.key === 'ArrowRight') s = clamp(s + step, 0, 1);
    else if (event.key === 'ArrowUp') v = clamp(v + step, 0, 1);
    else if (event.key === 'ArrowDown') v = clamp(v - step, 0, 1);
    else return;
    event.preventDefault();
    commit({ h: hsv.h, s, v });
  };

  const current = hsvToHex(hsv);
  const hueColour = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const ink = inkFor(current);

  return (
    <FullScreen
      title={title}
      onClose={onClose}
      right={
        <Button variant="surface" size="sm" onClick={onClose}>
          {t('Done')}
        </Button>
      }
    >
      <div className="colour-screen">
        {/* What is being chosen, once, at the size of a thing rather than a swatch — and what the
            app will do with it, which is the part a swatch alone can never say. */}
        <div className="colour-screen__ident">
          <span className="colour-screen__preview" style={{ background: current }} aria-hidden="true" />
          <div className="stack-1">
            <span className="t-strong t-mono-num">{current.toUpperCase()}</span>
            <span className="t-sm t-faint">
              {t('Saturation {s}%, brightness {v}%', {
                s: Math.round(hsv.s * 100),
                v: Math.round(hsv.v * 100),
              })}
            </span>
            <span className="t-sm t-faint">
              {t('The cards take it with {ink} ink — {ratio}:1', {
                ink: ink.light ? t('light') : t('dark'),
                ratio: ink.ratio.toFixed(1),
              })}
            </span>
          </div>
        </div>

        <div className="stack-2">
          <span className="field__label">{t('Colours')}</span>
          <div className="colour-screen__grid">
            {swatches.map((swatch) => {
              const colour = swatch.toLowerCase();
              return (
                <button
                  key={swatch}
                  type="button"
                  className={`colour-screen__swatch${colour === current ? ' is-selected' : ''}`}
                  style={{ background: swatch }}
                  aria-label={colour}
                  aria-pressed={colour === current}
                  onClick={() => commit(hexToHsv(colour))}
                />
              );
            })}
          </div>
        </div>

        {image && onPickFromPhoto ? (
          <button type="button" className="colour-screen__photo" onClick={onPickFromPhoto}>
            <span
              className="colour-screen__photo-thumb"
              style={{ backgroundImage: `url("${image}")` }}
              aria-hidden="true"
            />
            <span className="stack-1 grow">
              <span className="t-strong">{t('From your photo')}</span>
              <span className="t-sm t-faint">{t('Take a colour out of the picture itself.')}</span>
            </span>
            <Icon name="chevronRight" size={16} />
          </button>
        ) : null}

        <div className="stack-2">
          <span className="field__label">{t('Spectrum')}</span>
          <div
            ref={padRef}
            className="colour-screen__pad"
            style={{ ['--pad-hue' as string]: hueColour }}
            tabIndex={0}
            role="slider"
            aria-label={t('Saturation and brightness')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(hsv.s * 100)}
            aria-valuetext={t('Saturation {s}%, brightness {v}%', {
              s: Math.round(hsv.s * 100),
              v: Math.round(hsv.v * 100),
            })}
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse' && event.button !== 0) return;
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              fromPointer(event);
            }}
            onPointerMove={(event) => {
              if (!dragging.current) return;
              fromPointer(event);
            }}
            onPointerUp={(event) => {
              dragging.current = false;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            onKeyDown={padKeys}
          >
            <span
              className="colour-screen__pad-thumb"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: current }}
              aria-hidden="true"
            />
          </div>
          {/* A real range input: a thumb that can be dragged, arrowed and read by a screen reader.
              Re-implementing it as a div would have meant rebuilding all three. */}
          <label className="colour-screen__hue">
            <span className="sr-only">{t('Hue')}</span>
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={Math.round(hsv.h)}
              onChange={(event) => commit({ h: Number(event.target.value), s: hsv.s, v: hsv.v })}
            />
          </label>
        </div>

        {/* The value, typed. Applied only when it is a whole colour, so a half-typed hex cannot
            repaint anything — the field keeps the draft and the colour waits. */}
        <label className="field" htmlFor={hexId}>
          <span className="field__label">{t('Hex value')}</span>
          <input
            id={hexId}
            className="input t-mono-num"
            value={draft}
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              const channels = readHex(next);
              if (channels) {
                const hex =
                  '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
                setHsv(hexToHsv(hex));
                onChange(hex);
              }
            }}
            onBlur={() => setDraft(current)}
          />
        </label>
      </div>
    </FullScreen>
  );
}
