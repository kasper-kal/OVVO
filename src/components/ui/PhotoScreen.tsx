import { useEffect, useRef, useState } from 'react';
import { Button } from './primitives';
import { FullScreen } from './FullScreen';
import { useT } from '../../lib/useT';
import { inkFor, toHex } from '../../lib/colour';

/**
 * **Taking a colour out of the photograph, on a screen of its own.**
 *
 * The complaint this answers, in the traveller's words: *"you have no way of seeing what your
 * currently Eyedropping, a big part of the image gets cropped off."* Both were true of the sampler
 * that lived in the Background block: a 200px `object-fit: cover` band (38% of the picture's height
 * cropped away at 1440 — measured) with no loupe, no crosshair and no swatch, where the only feedback
 * was a card *behind* the picture changing colour.
 *
 * Three things make it a sampler rather than a picture here:
 *
 *   • **The whole photograph, uncropped.** The `<img>` is sized by its own content inside a centred
 *     stage, so its box *is* the drawn picture — no `cover`, no crop, and the pointer maps to a pixel
 *     by a fraction of that box. Nothing is lost to make the screen tidy.
 *   • **A visible eyedropper.** A 112px loupe rides above the pointer — above the finger, so the
 *     finger never covers the pixel — showing the surrounding pixels at 6× with a crosshair, and a
 *     hex chip on it. Dragging sweeps the picture.
 *   • **The colour, twice.** On the loupe at the point, and in the foot bar with the ink the cards
 *     will be given and its ratio. Both are the *candidate*: this screen writes on commit, not on
 *     every pixel, because a colour under a finger is not a decision (and writing per pixel rewrote
 *     the whole settings object dozens of times a second).
 *
 * The platform's own `EyeDropper` is offered where the browser has one, as a secondary action: it can
 * sample anything visible on the screen, which the picture alone cannot.
 */

export function PhotoScreen({
  open,
  image,
  value,
  onCommit,
  onClose,
  onCrop,
}: {
  open: boolean;
  /** The photograph, as a data URL. */
  image: string;
  /** The colour currently in force, `#rrggbb` — what a cancel returns to. */
  value: string;
  /** Fires once, when the traveller leaves with the colour. */
  onCommit: (hex: string) => void;
  onClose: () => void;
  /** Opens the crop screen. */
  onCrop: () => void;
}) {
  const t = useT();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const loupeRef = useRef<HTMLCanvasElement | null>(null);
  /** The pixel last sampled, in source pixels — what the arrow keys step from. */
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [hex, setHex] = useState(value);
  /** Where the loupe is, in stage pixels; `null` until the pointer has been over the picture. */
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  /* The picture decoded once, at a bounded working size, into a canvas whose pixels can be read.
     A data URL from this browser's own storage does not taint the canvas, so no upload is involved. */
  useEffect(() => {
    if (!open || !image) return undefined;
    let cancelled = false;
    setReady(false);
    setError('');
    setCursor(null);
    lastRef.current = null;
    const frame = new Image();
    frame.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 2048 / Math.max(frame.naturalWidth, frame.naturalHeight));
      canvas.width = Math.max(1, Math.round(frame.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(frame.naturalHeight * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        setError('This browser cannot read the photo.');
        return;
      }
      context.drawImage(frame, 0, 0, canvas.width, canvas.height);
      sourceRef.current = canvas;
      setReady(true);
    };
    frame.onerror = () => setError('That image could not be read.');
    frame.src = image;
    return () => {
      cancelled = true;
    };
  }, [open, image]);

  /* A fresh screen starts from the colour in force — the one a cancel goes back to. */
  useEffect(() => {
    if (open) {
      setHex(value);
      setCursor(null);
      lastRef.current = null;
    }
  }, [open, value]);

  if (!open) return null;

  /** The source pixel a viewport point falls on, plus where that point is inside the stage. */
  const pixelAt = (clientX: number, clientY: number) => {
    const canvas = sourceRef.current;
    const picture = imageRef.current;
    const stage = stageRef.current;
    if (!canvas || !picture || !stage) return null;
    const rect = picture.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const stageRect = stage.getBoundingClientRect();
    /* The `img` is sized by its own content (`max-width`/`max-height`), so its box **is** the drawn
       picture: a fraction of the box is a fraction of the source, with no cover geometry to undo. */
    const fx = (clientX - rect.left) / rect.width;
    const fy = (clientY - rect.top) / rect.height;
    return {
      x: Math.min(canvas.width - 1, Math.max(0, Math.round(fx * canvas.width))),
      y: Math.min(canvas.height - 1, Math.max(0, Math.round(fy * canvas.height))),
      stageX: clientX - stageRect.left,
      stageY: clientY - stageRect.top,
    };
  };

  const sample = (event: { clientX: number; clientY: number }) => {
    const point = pixelAt(event.clientX, event.clientY);
    const canvas = sourceRef.current;
    if (!point || !canvas) return;
    lastRef.current = { x: point.x, y: point.y };
    setCursor({ x: point.stageX, y: point.stageY });
    const data = canvas
      .getContext('2d', { willReadFrequently: true })
      ?.getImageData(point.x, point.y, 1, 1).data;
    if (data) setHex(toHex([data[0], data[1], data[2]]));
    /* The loupe is drawn from the same canvas, magnified about the pixel under the pointer. A
       transparent margin at the picture's edge is honest: there is nothing there to sample. */
    const loupe = loupeRef.current;
    const context = loupe?.getContext('2d');
    if (loupe && context) {
      const radius = loupe.width / 12;
      context.clearRect(0, 0, loupe.width, loupe.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(
        canvas,
        point.x - radius,
        point.y - radius,
        radius * 2,
        radius * 2,
        0,
        0,
        loupe.width,
        loupe.height,
      );
    }
  };

  /** Move the sample by whole source pixels — the keyboard's way round this screen. */
  const step = (dx: number, dy: number) => {
    const canvas = sourceRef.current;
    const picture = imageRef.current;
    if (!canvas || !picture) return;
    const from = lastRef.current ?? {
      x: Math.round(canvas.width / 2),
      y: Math.round(canvas.height / 2),
    };
    const x = Math.min(canvas.width - 1, Math.max(0, from.x + dx));
    const y = Math.min(canvas.height - 1, Math.max(0, from.y + dy));
    const rect = picture.getBoundingClientRect();
    sample({
      clientX: rect.left + ((x + 0.5) / canvas.width) * rect.width,
      clientY: rect.top + ((y + 0.5) / canvas.height) * rect.height,
    });
  };

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const ink = inkFor(hex);

  return (
    <FullScreen
      title={t('From your photo')}
      onClose={onClose}
      flush
      right={
        <Button variant="surface" size="sm" onClick={() => onCommit(hex)}>
          {t('Done')}
        </Button>
      }
    >
      <div className="photo-screen">
        <div
          ref={stageRef}
          className="photo-screen__stage"
          tabIndex={0}
          role="group"
          aria-label={t('Tap or drag the photo to take its colour')}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            sample(event);
          }}
          onPointerMove={(event) => {
            /* A mouse sweeps without holding (the visible eyedropper); a finger samples while it is
               down. */
            if (dragging.current || event.pointerType === 'mouse') sample(event);
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
          onPointerLeave={() => {
            if (!dragging.current) setCursor(null);
          }}
          onKeyDown={(event) => {
            const size = event.shiftKey ? 10 : 1;
            if (event.key === 'ArrowLeft') step(-size, 0);
            else if (event.key === 'ArrowRight') step(size, 0);
            else if (event.key === 'ArrowUp') step(0, -size);
            else if (event.key === 'ArrowDown') step(0, size);
            else return;
            event.preventDefault();
          }}
        >
          <img
            ref={imageRef}
            className="photo-screen__picture"
            src={image}
            alt=""
            draggable={false}
          />
          {error ? <p className="photo-screen__error">{t(error)}</p> : null}
          {!ready && !error ? <p className="t-sm t-faint">{t('Loading your photo…')}</p> : null}
          {/*
            The loupe is always mounted and merely hidden until the pointer arrives: mounting it on
            the first move would give the draw call a canvas that was not in the document yet, so the
            first sample of a drag would show an empty circle.
          */}
          <span
            className={`photo-screen__loupe${cursor ? '' : ' is-hidden'}`}
            style={cursor ? { left: `${cursor.x}px`, top: `${cursor.y}px` } : undefined}
            aria-hidden="true"
          >
            <span className="photo-screen__loupe-disc">
              <canvas ref={loupeRef} width={112} height={112} />
              <span className="photo-screen__loupe-cross" />
            </span>
            <span className="photo-screen__loupe-hex t-mono-num">{hex.toUpperCase()}</span>
          </span>
        </div>

        <div className="photo-screen__foot">
          <span className="photo-screen__swatch" style={{ background: hex }} aria-hidden="true" />
          <div className="stack-1 grow">
            <span className="t-strong t-mono-num">{hex.toUpperCase()}</span>
            <span className="t-sm t-faint">
              {t('The cards take it with {ratio}:1 ink', { ratio: ink.ratio.toFixed(1) })}
            </span>
          </div>
          {hasEyeDropper ? (
            <Button
              variant="ghost"
              size="sm"
              icon="pipette"
              onClick={async () => {
                const api = (
                  window as unknown as {
                    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
                  }
                ).EyeDropper;
                if (!api) return;
                try {
                  const result = await new api().open();
                  if (result?.sRGBHex) setHex(result.sRGBHex.toLowerCase());
                } catch {
                  /* Dismissed: the colour in force is still the right answer. */
                }
              }}
            >
              {t('Eyedropper')}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" icon="crop" onClick={onCrop}>
            {t('Crop')}
          </Button>
        </div>
        <p className="photo-screen__hint t-sm t-faint">
          {t('Drag the picture to sample, or use the arrow keys. Done keeps the colour.')}
        </p>
        <span className="sr-only" aria-live="polite">
          {hex}
        </span>
      </div>
    </FullScreen>
  );
}
