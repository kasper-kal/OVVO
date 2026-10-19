/**
 * **Cropping the traveller's photograph, as maths rather than as a screen.**
 *
 * The app keeps two copies of a background photo (`COLOURS_PLAN.md` §5): the **source**, downscaled
 * to a bounded edge and never thrown away, and the **baked** crop the page actually draws. The crop
 * is stored as four fractions of the source — `x`, `y`, `w`, `h` — so the crop screen can be reopened
 * on the stored source and show exactly the frame the traveller left.
 *
 * Everything here is pure except `loadImage` and `bakeCrop`, which touch the DOM because a canvas is
 * the only way to resample a picture. Keeping the geometry separate is what lets the frame maths be
 * checked without a browser (see `.logs/colours-redesign.cjs` and the assertions in the plan).
 */

export interface CropRect {
  /** Left edge, as a fraction of the source's width (0–1). */
  x: number;
  /** Top edge, as a fraction of the source's height (0–1). */
  y: number;
  /** Width, as a fraction of the source's width (0 < w ≤ 1). */
  w: number;
  /** Height, as a fraction of the source's height (0 < h ≤ 1). */
  h: number;
}

/** No crop at all: the whole picture, which is what choosing a photo does on its own. */
export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

/** The narrowest frame the crop screen allows, so a frame cannot be dragged into a sliver. */
const MIN_W = 0.04;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The widest centred frame of a given screen aspect that fits inside the whole picture — the "cover"
 * crop, made visible.
 *
 * `aspect` is the frame's width ÷ height in **screen** pixels; `sourceAspect` is the picture's own
 * width ÷ height. A frame wider than the picture keeps the full width and takes a band of its
 * height, and the reverse.
 */
export function centeredCrop(aspect: number, sourceAspect: number): CropRect {
  if (!Number.isFinite(aspect) || aspect <= 0) return FULL_CROP;
  if (aspect >= sourceAspect) {
    const h = sourceAspect / aspect;
    return { x: 0, y: (1 - h) / 2, w: 1, h };
  }
  const w = aspect / sourceAspect;
  return { x: (1 - w) / 2, y: 0, w, h: 1 };
}

/** The frame's aspect in the picture's own fractions (w ÷ h) — what `zoom` keeps constant. */
export function cropFractionAspect(rect: CropRect): number {
  return rect.w / rect.h;
}

/** Move the frame by a fraction of the **source**, stopped at the picture's edges. */
export function moveCrop(rect: CropRect, dx: number, dy: number): CropRect {
  return {
    ...rect,
    x: Math.min(1 - rect.w, Math.max(0, rect.x + dx)),
    y: Math.min(1 - rect.h, Math.max(0, rect.y + dy)),
  };
}

/**
 * Zoom the frame about its own centre. `factor` is how much **larger** the frame becomes (2 halves
 * the zoomed area). The frame keeps its aspect, is clamped to the picture's edges, and never grows
 * past the whole photograph.
 */
export function zoomCrop(rect: CropRect, factor: number, anchor = { x: 0.5, y: 0.5 }): CropRect {
  const fractionAspect = cropFractionAspect(rect);
  /* Where the anchor sits inside the frame, as a fraction of the frame. */
  const anchorX = clamp01(anchor.x);
  const anchorY = clamp01(anchor.y);
  /* The anchor's position in the picture, which must not move while the frame grows or shrinks. */
  const pointX = rect.x + rect.w * anchorX;
  const pointY = rect.y + rect.h * anchorY;

  const w = Math.min(1, Math.max(MIN_W, rect.w * factor));
  const h = Math.min(1, Math.max(MIN_W, w / fractionAspect));
  /* The height cap can bind before the width does on a tall picture; keep the aspect either way. */
  const clampedW = h * fractionAspect > 1 ? 1 : h * fractionAspect;

  const x = Math.min(1 - clampedW, Math.max(0, pointX - clampedW * anchorX));
  const y = Math.min(1 - h, Math.max(0, pointY - h * anchorY));
  return { x, y, w: clampedW, h };
}

/** Change the frame's aspect, keeping its centre and as much of its area as the picture allows. */
export function reframeCrop(rect: CropRect, aspect: number, sourceAspect: number): CropRect {
  const centred = centeredCrop(aspect, sourceAspect);
  /* Keep the current centre, then fit the new shape around it inside the picture. */
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const w = centred.w;
  const h = centred.h;
  return {
    w,
    h,
    x: Math.min(1 - w, Math.max(0, cx - w / 2)),
    y: Math.min(1 - h, Math.max(0, cy - h / 2)),
  };
}

/**
 * The background-position that keeps a baked crop's centre in view when another screen re-crops it.
 *
 * The page draws the photo with `cover`; saving this pair means a phone showing a desktop's crop
 * still opens on the part the traveller framed. `0` and `1` would be meaningless here (there is no
 * movement left once the frame reaches an edge), so they are clamped just inside.
 */
export function cropFocus(rect: CropRect): { x: number; y: number } {
  return {
    x: Math.round(clamp01(rect.x + rect.w / 2) * 1000) / 10,
    y: Math.round(clamp01(rect.y + rect.h / 2) * 1000) / 10,
  };
}

/**
 * The CSS `background-size` / `background-position` that shows exactly this frame filling a box whose
 * aspect is the frame's — the crop screen's "as it will look" preview, derived rather than baked so
 * it updates on every drag.
 */
export function cropBackground(rect: CropRect): { size: string; position: string } {
  const size = `${100 / rect.w}% auto`;
  const px = rect.w >= 1 ? 0 : (rect.x / (1 - rect.w)) * 100;
  const py = rect.h >= 1 ? 0 : (rect.y / (1 - rect.h)) * 100;
  return { size, position: `${px}% ${py}%` };
}

/* ------------------------------------------------------------------ the DOM half */

/** Decode a data URL into an element a canvas can draw. Always 0×0 until `onload` fires. */
export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be read.'));
    image.src = source;
  });
}

/** The pixel box a frame covers in a picture of these dimensions. */
export function cropPixels(
  rect: CropRect,
  width: number,
  height: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const sx = Math.round(rect.x * width);
  const sy = Math.round(rect.y * height);
  return {
    sx,
    sy,
    sw: Math.max(1, Math.min(width - sx, Math.round(rect.w * width))),
    sh: Math.max(1, Math.min(height - sy, Math.round(rect.h * height))),
  };
}

/**
 * Crop at full resolution, **then** downscale — the order matters. The old path downscaled the upload
 * to 1600px and let the page crop afterwards, so a tight crop kept 1600px of a region that was only a
 * fraction of the frame. This keeps the detail inside the frame and throws away the rest.
 */
export async function bakeCrop(
  source: string,
  rect: CropRect,
  maxEdge: number,
  quality = 0.84,
): Promise<string> {
  const image = await loadImage(source);
  const { sx, sy, sw, sh } = cropPixels(rect, image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot resize an image.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
