import { useEffect, useRef, useState } from 'react';
import { Button, IconButton } from './primitives';
import { FullScreen } from './FullScreen';
import { useT } from '../../lib/useT';
import {
  centeredCrop,
  cropBackground,
  moveCrop,
  reframeCrop,
  zoomCrop,
  type CropRect,
} from '../../lib/photoCrop';

/**
 * **Framing the photograph, as the page will actually draw it.**
 *
 * The order, in the traveller's words: *"It should show the **exact** way it will be shown in the
 * websites background"*, and cropping is *"offered but doesn't do it automatically"*. So this screen
 * opens only when **Crop** is pressed, and what it promises is not a pretty square preview but the
 * page's own rendering: the preview at the foot uses the same two-layer background the `body` uses —
 * the canvas wash over the picture, scaled so the frame covers the page, positioned on the frame's
 * centre — computed from the frame and the picture's real dimensions. For the default *This screen*
 * frame, preview and page are the same drawing.
 *
 * The interaction is the one every cropper has, because it needs no explaining: the picture moves
 * under a frame, a wheel or a pinch zooms, and the frame is drawn as a frame — four corners, a dimmed
 * surround — rather than as a white rectangle. Three frames are offered — the screen you are on, a
 * phone's 9:16, and a square — and **Save** bakes the crop at full resolution before downscaling it
 * (`lib/photoCrop.ts`), so a tight frame keeps more detail than the old "downscale the upload, crop
 * later" path could.
 *
 * There is **one** picture on this screen. It used to carry a second, full-width "As it will look"
 * panel below the frame: a duplicate of the same drawing at the page's own (portrait) shape, which on
 * a phone filled the rest of the screen and pushed the controls out of sight — reported as "the
 * cropping UX is just horrible". The frame *is* the crop; a second view of it says nothing new.
 */

type Frame = 'screen' | 'phone' | 'square';

/** A 9:16 phone in portrait, and a square. */
const FRAME_ASPECT: Record<Exclude<Frame, 'screen'>, number> = {
  phone: 9 / 16,
  square: 1,
};

export function PhotoCropScreen({
  open,
  source,
  crop,
  onSave,
  onClose,
}: {
  open: boolean;
  /** The **whole** picture — `backgroundImageSource`, or the baked image for an older browser. */
  source: string;
  /** The frame last saved, if any; `null` means the whole picture. */
  crop: CropRect | null;
  onSave: (rect: CropRect, frame: Frame) => void;
  onClose: () => void;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchFrom = useRef(0);
  const dragging = useRef(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<Frame>('screen');
  const [pageAspect, setPageAspect] = useState(() =>
    typeof window === 'undefined' ? 16 / 9 : window.innerWidth / window.innerHeight,
  );
  const [rect, setRect] = useState<CropRect>(crop ?? { x: 0, y: 0, w: 1, h: 1 });

  /* The picture's own dimensions, which the frame maths and the preview both need. */
  useEffect(() => {
    if (!open || !source) return;
    const image = new Image();
    image.onload = () => setSize({ w: image.naturalWidth, h: image.naturalHeight });
    image.src = source;
  }, [open, source]);

  /* A fresh screen starts from the frame in force, and re-reads the page's shape on every open. */
  useEffect(() => {
    if (!open) return;
    const nextAspect = window.innerWidth / window.innerHeight;
    setPageAspect(nextAspect);
    setFrame('screen');
    setRect(crop ?? { x: 0, y: 0, w: 1, h: 1 });
    const onResize = () => setPageAspect(window.innerWidth / window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, crop]);

  /*
   * **The frame this screen opens with is the page's shape**, once the picture's size is known.
   * The saved frame wins when there is one — that is what makes re-cropping a continuation rather
   * than a restart — and a picture with no frame yet opens as the centred "cover" frame the page
   * would draw for itself, not as the whole picture, which would promise a shape the page cannot
   * keep. Runs only while there is no stored crop, so a zoom or a drag is never undone by it.
   */
  useEffect(() => {
    if (!open || !size || crop) return;
    setRect(centeredCrop(pageAspect, size.w / size.h));
  }, [open, size, crop, pageAspect]);

  if (!open) return null;

  const sourceAspect = size ? size.w / size.h : 1;
  const frameAspect = frame === 'screen' ? pageAspect : FRAME_ASPECT[frame];

  const chooseFrame = (next: Frame) => {
    setFrame(next);
    const aspect = next === 'screen' ? pageAspect : FRAME_ASPECT[next];
    setRect((current) => reframeCrop(current, aspect, sourceAspect));
  };

  const drag = (dxPx: number, dyPx: number) => {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    setRect((current) => moveCrop(current, -dxPx / box.width, -dyPx / box.height));
  };

  const zoom = (factor: number) => setRect((current) => zoomCrop(current, factor));

  /* The mapping the saved crop will use, kept as a hidden marker for the checks that read it. */
  const ratio = cropBackground(rect);

  return (
    <FullScreen
      title={t('Crop the photo')}
      onClose={onClose}
      flush
      right={
        <Button variant="accent" size="sm" onClick={() => onSave(rect, frame)}>
          {t('Save')}
        </Button>
      }
    >
      <div className="crop-screen">
        <div className="crop-screen__stage">
          <div
            ref={canvasRef}
            className="crop-screen__canvas"
            tabIndex={0}
            role="group"
            aria-label={t('Drag to move the picture; pinch or use the wheel to zoom')}
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse' && event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              dragging.current = true;
              if (pointers.current.size === 2) {
                const [a, b] = [...pointers.current.values()];
                pinchFrom.current = Math.hypot(a.x - b.x, a.y - b.y);
              }
            }}
            onPointerMove={(event) => {
              if (!dragging.current) return;
              const previous = pointers.current.get(event.pointerId);
              if (!previous) return;
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              if (pointers.current.size === 2) {
                const [a, b] = [...pointers.current.values()];
                const distance = Math.hypot(a.x - b.x, a.y - b.y);
                if (pinchFrom.current > 0) zoom(pinchFrom.current / Math.max(1, distance));
                pinchFrom.current = distance;
                return;
              }
              drag(event.clientX - previous.x, event.clientY - previous.y);
            }}
            onPointerUp={(event) => {
              pointers.current.delete(event.pointerId);
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              if (pointers.current.size !== 2) pinchFrom.current = 0;
              dragging.current = pointers.current.size > 0;
            }}
            onPointerCancel={(event) => {
              pointers.current.delete(event.pointerId);
              dragging.current = pointers.current.size > 0;
            }}
            onWheel={(event) => {
              /* Wheel down grows the frame (zoom out); wheel up tightens it. */
              zoom(Math.exp(event.deltaY * 0.0015));
            }}
            onKeyDown={(event) => {
              /* Whole fractions of the picture, not pixels: the arrow keys move the frame by 1% of
                 the picture (5% with Shift), so the step is the same on a phone and a desktop. */
              const stepSize = event.shiftKey ? 0.05 : 0.01;
              if (event.key === 'ArrowLeft') setRect((current) => moveCrop(current, -stepSize, 0));
              else if (event.key === 'ArrowRight') setRect((current) => moveCrop(current, stepSize, 0));
              else if (event.key === 'ArrowUp') setRect((current) => moveCrop(current, 0, -stepSize));
              else if (event.key === 'ArrowDown') setRect((current) => moveCrop(current, 0, stepSize));
              else if (event.key === '+' || event.key === '=') zoom(1 / 1.2);
              else if (event.key === '-') zoom(1.2);
              else return;
              event.preventDefault();
            }}
          >
            <img
              className="crop-screen__picture"
              src={source}
              alt=""
              draggable={false}
              style={{ aspectRatio: String(sourceAspect) }}
            />
            {/* The frame, drawn in percentages of the picture's own box — no geometry to keep in
                step with the pointer maths, because both are the same fractions. */}
            <span
              className="crop-screen__frame"
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
              }}
              aria-hidden="true"
            >
              {/* Four corners, because a white rectangle over a photograph is a selection and a
                  frame has to read as one you can aim. */}
              <span className="crop-screen__corner crop-screen__corner--tl" />
              <span className="crop-screen__corner crop-screen__corner--tr" />
              <span className="crop-screen__corner crop-screen__corner--bl" />
              <span className="crop-screen__corner crop-screen__corner--br" />
            </span>
          </div>
        </div>

        <div className="crop-screen__controls">
          <div className="field">
            <span className="field__label">{t('Frame')}</span>
            <div className="segmented segmented--sm" role="group" aria-label={t('Frame')}>
              {(
                [
                  { value: 'screen' as Frame, label: t('This screen') },
                  { value: 'phone' as Frame, label: t('Phone') },
                  { value: 'square' as Frame, label: t('Square') },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="segmented__btn"
                  aria-pressed={frame === option.value}
                  onClick={() => chooseFrame(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="crop-screen__tools">
            <IconButton icon="zoomOut" label={t('Zoom out')} onClick={() => zoom(1.25)} />
            <span className="t-sm t-muted crop-screen__share">{t('{share}% of the picture', {
              share: Math.round(rect.w * rect.h * 100),
            })}</span>
            <IconButton icon="zoomIn" label={t('Zoom in')} onClick={() => zoom(1 / 1.25)} />
            <Button
              variant="ghost"
              size="sm"
              icon="refresh"
              onClick={() => setRect(centeredCrop(frameAspect, sourceAspect))}
            >
              {t('Reset')}
            </Button>
          </div>

          <p className="t-sm t-muted crop-screen__hint">
            {t('Drag to move the picture; pinch or use the wheel to zoom')}
          </p>
          {/* A hidden marker for the mapping the saved crop will use; the checks read it. */}
          <span className="sr-only" data-crop-background={ratio.size} />
        </div>
      </div>
    </FullScreen>
  );
}
