import { useEffect, useRef } from 'react';

/*
 * **The moving ground.**
 *
 * Wrapped is not a slide deck with a background: the background is the scene, and it keeps moving
 * while the sentence lands. These are five small canvas paintings in the reference's grammar:
 * saturated folded ribbons, stair blocks, wave bars, a tunnel and a bloom. A slow camera push and
 * drift keep them from looking like a looping wallpaper.
 *
 * The middle of the canvas stays quieter than the edges. The copy sits there; the motion carries the
 * eye around it instead of shouting over it.
 */

export type MotionMode = 'ribbons' | 'stairs' | 'wave' | 'tunnel' | 'bloom';

type Palette = [string, string, string];

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/* One ribbon is a filled fold, not a glowing line: a thick body, a bright top edge and a shadow under it. */
function ribbonPass(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  p: Palette,
  base: number,
  phase: number,
  width: number,
  alpha: number,
): void {
  const points: Array<{ x: number; y: number; thickness: number }> = [];
  for (let x = -40; x <= w + 40; x += 6) {
    const y =
      base +
      Math.sin(x * 0.0075 + t * 0.8 + phase) * h * 0.095 +
      Math.cos(x * 0.016 - t * 0.5 + phase * 1.7) * h * 0.038 +
      Math.sin(x * 0.027 + t * 0.35) * h * 0.012;
    const thickness = width * (1 + 0.18 * Math.sin(x * 0.011 + t * 0.7 + phase));
    points.push({ x, y, thickness });
  }

  const grad = ctx.createLinearGradient(0, base - h * 0.2, w, base + h * 0.2);
  grad.addColorStop(0, p[0]);
  grad.addColorStop(0.5, p[1]);
  grad.addColorStop(1, p[2]);

  /* The body is a closed strip: one edge above the centre line, one below. */
  ctx.beginPath();
  points.forEach((point, index) => {
    const y = point.y - point.thickness / 2;
    if (index === 0) ctx.moveTo(point.x, y);
    else ctx.lineTo(point.x, y);
  });
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    ctx.lineTo(point.x, point.y + point.thickness / 2);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = p[1];
  ctx.shadowBlur = 24;
  ctx.fill();

  /* The lit top edge and the shadowed bottom edge make the strip feel folded. */
  ctx.shadowBlur = 0;
  ctx.globalAlpha = Math.min(1, alpha + 0.12);
  ctx.strokeStyle = p[2];
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  points.forEach((point, index) => {
    const y = point.y - point.thickness * 0.38;
    if (index === 0) ctx.moveTo(point.x, y);
    else ctx.lineTo(point.x, y);
  });
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = Math.max(2, width * 0.18);
  ctx.beginPath();
  points.forEach((point, index) => {
    const y = point.y + point.thickness * 0.44;
    if (index === 0) ctx.moveTo(point.x, y);
    else ctx.lineTo(point.x, y);
  });
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function ribbons(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  /* The top and bottom folds are the scene's frame. */
  for (const top of [true, false]) {
    for (let band = 0; band < 4; band += 1) {
      const base = top ? h * (0.08 + band * 0.045) : h - h * (0.08 + band * 0.045);
      ribbonPass(ctx, w, h, t, p, base, band * 1.35 + (top ? 0 : 2.1), 13 + band * 6, 0.86 - band * 0.1);
    }
  }

  /* A single wide fold crosses the quiet middle, so the whole frame is alive. */
  ribbonPass(ctx, w, h, t, p, h * 0.53, 4.4, 13, 0.12);

  /* Small hot sparks catch the light along the fold. */
  for (let spark = 0; spark < 18; spark += 1) {
    const x = ((spark / 18) * w + t * 24 + spark * 53) % (w + 40) - 20;
    const y = h * 0.5 + Math.sin(x * 0.012 + t * 1.1 + spark) * h * 0.24;
    ctx.fillStyle = p[spark % 3];
    ctx.globalAlpha = 0.22 + 0.18 * Math.sin(t * 2 + spark);
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (spark % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function stairs(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, w, h);

  const cols = 22;
  const rows = 9;
  const step = w / cols;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const centre = Math.abs(col - (cols - 1) / 2) / ((cols - 1) / 2);
      const tower = (1 - centre) * h * 0.15;
      const wobble = Math.sin(t * 1.05 + col * 0.48 + row * 0.62) * 8;
      const height = Math.max(10, tower + wobble);
      const x = col * step;
      const y = row * (h * 0.018) + Math.sin(t * 0.24 + col * 0.05) * 4;
      ctx.fillStyle = row % 2 ? p[2] : p[1];
      ctx.globalAlpha = 0.88 - row * 0.055;
      ctx.fillRect(x + 1, y, step - 2, height);
      ctx.fillStyle = row % 2 ? p[1] : p[2];
      ctx.fillRect(x + 1, h - y - height, step - 2, height);
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(5, 5, 5, 0.18)';
  ctx.fillRect(0, h * 0.36, w, h * 0.28);
}

function wave(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  const bars = 42;
  const gap = w / bars;
  for (let index = 0; index < bars; index += 1) {
    const x = index * gap + gap * 0.16;
    const centre = Math.abs(index - (bars - 1) / 2) / ((bars - 1) / 2);
    const base = (1 - centre) * h * 0.23;
    const height = Math.max(7, base + Math.sin(t * 1.9 + index * 0.37) * h * 0.075);
    const grad = ctx.createLinearGradient(0, h - height, 0, h);
    grad.addColorStop(0, p[2]);
    grad.addColorStop(1, p[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(x, h - height, gap * 0.62, height);
    ctx.globalAlpha = 0.32;
    ctx.fillRect(x, 0, gap * 0.62, height * 0.7);
    ctx.globalAlpha = 1;
  }

  /* A slow ring around the copy makes the whole frame look like it is breathing. */
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(t * 0.035);
  dataRing(ctx, Math.min(w, h) * 0.32, p, t);
  ctx.restore();
}

function dataRing(ctx: CanvasRenderingContext2D, radius: number, p: Palette, t: number): void {
  for (let tick = 0; tick < 40; tick += 1) {
    const angle = (tick / 40) * Math.PI * 2;
    const length = 3 + (Math.sin(t * 1.7 + tick * 0.8) + 1) * 6;
    ctx.strokeStyle = p[tick % 3];
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.lineTo(Math.cos(angle) * (radius + length), Math.sin(angle) * (radius + length));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function tunnel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.sin(t * 0.12) * 0.035);

  for (let ring = 0; ring < 20; ring += 1) {
    const beat = (t * 0.2 + ring / 20) % 1;
    const scale = 0.12 + beat * 1.25;
    const width = w * scale;
    const height = h * scale * 0.8;
    const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
    grad.addColorStop(0, p[0]);
    grad.addColorStop(0.5, p[1]);
    grad.addColorStop(1, p[2]);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.72 * (1 - beat * 0.72);
    ctx.lineWidth = 3 + (1 - beat) * 3;
    roundedPath(ctx, -width / 2, -height / 2, width, height, 26 + beat * 28);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * 0.22);
  glow.addColorStop(0, p[2]);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.24 + Math.sin(t * 1.2) * 0.05;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function bloom(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let index = 0; index < 8; index += 1) {
    const angle = t * 0.22 + (index / 8) * Math.PI * 2;
    const cx = w / 2 + Math.cos(angle) * w * (0.3 + 0.06 * Math.sin(t * 0.5 + index));
    const cy = h / 2 + Math.sin(angle * 1.2) * h * 0.28;
    const radius = Math.min(w, h) * (0.16 + 0.06 * Math.sin(t * 0.9 + index * 1.8));
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, p[index % 3]);
    grad.addColorStop(0.4, p[(index + 1) % 3]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.52;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /* A handful of tiny lights ride the bloom. */
  for (let dot = 0; dot < 26; dot += 1) {
    const angle = t * 0.14 + dot * 2.4;
    const distance = Math.min(w, h) * (0.14 + ((dot * 37) % 100) / 100 * 0.42);
    const cx = w / 2 + Math.cos(angle) * distance;
    const cy = h / 2 + Math.sin(angle * 1.3) * distance * 0.8;
    ctx.fillStyle = p[dot % 3];
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t + dot);
    ctx.beginPath();
    ctx.arc(cx, cy, 1 + (dot % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

export function WrappedMotion({
  mode,
  palette,
  still = false,
}: {
  mode: MotionMode;
  palette: Palette;
  still?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (now: number) => {
      const time = still ? 0.8 : (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      /* A slow camera push and roll. The overscan keeps the frame full at every angle. */
      ctx.save();
      const zoom = still ? 1.06 : 1.08 + Math.sin(time * 0.21) * 0.018;
      ctx.translate(width / 2, height / 2);
      ctx.rotate(still ? 0 : Math.sin(time * 0.12) * 0.012);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      if (mode === 'ribbons') ribbons(ctx, width, height, time, palette);
      else if (mode === 'stairs') stairs(ctx, width, height, time, palette);
      else if (mode === 'wave') wave(ctx, width, height, time, palette);
      else if (mode === 'tunnel') tunnel(ctx, width, height, time, palette);
      else bloom(ctx, width, height, time, palette);

      ctx.restore();
      if (!still) frame = requestAnimationFrame(paint);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(paint);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [mode, palette, still]);

  return <canvas ref={ref} className="scene-motion" aria-hidden="true" />;
}
