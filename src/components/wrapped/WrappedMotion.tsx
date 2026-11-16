import { useEffect, useRef } from 'react';

/*
 * **The moving ground.**
 *
 * Wrapped is not a slide deck with a background: the background is the scene. These are small canvas
 * paintings in the same grammar as the reference video: saturated ribbons, stair blocks, wave bars,
 * tunnels and blooms, always moving, always leaving the middle of the screen quiet for the sentence.
 *
 * Canvas rather than a hundred DOM layers because this has to run on a phone while a song plays.
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

function ribbons(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const top of [true, false]) {
    for (let band = 0; band < 3; band += 1) {
      const base = top ? h * (0.12 + band * 0.035) : h - h * (0.12 + band * 0.035);
      const direction = top ? 1 : -1;
      const grad = ctx.createLinearGradient(0, base, w, base + direction * h * 0.18);
      grad.addColorStop(0, p[0]);
      grad.addColorStop(0.5, p[1]);
      grad.addColorStop(1, p[2]);

      ctx.strokeStyle = grad;
      ctx.shadowColor = p[1];
      ctx.shadowBlur = 28;
      ctx.lineWidth = 18 + band * 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 7) {
        const y =
          base +
          Math.sin(x * 0.009 + t * 0.8 + band * 1.5) * h * 0.075 +
          Math.cos(x * 0.017 - t * 0.55 + band) * h * 0.035;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      /* A translucent body under the bright edge makes the line read as folded ribbon. */
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 52 + band * 18;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

function stairs(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, w, h);

  const cols = 16;
  const step = w / cols;
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const centre = Math.abs(col - (cols - 1) / 2) / ((cols - 1) / 2);
      const tower = (1 - centre) * h * 0.12;
      const wobble = Math.sin(t * 1.1 + col * 0.52 + row * 0.7) * 6;
      const height = Math.max(8, tower + wobble);
      const x = col * step;
      const y = row * (h * 0.016);
      ctx.fillStyle = row % 2 ? p[2] : p[1];
      ctx.globalAlpha = 0.82 - row * 0.06;
      ctx.fillRect(x + 1, y, step - 2, height);

      ctx.fillStyle = row % 2 ? p[1] : p[2];
      ctx.fillRect(x + 1, h - y - height, step - 2, height);
    }
  }
  ctx.globalAlpha = 1;
}

function wave(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  const bars = 34;
  const gap = w / bars;
  for (let index = 0; index < bars; index += 1) {
    const x = index * gap + gap * 0.18;
    const centre = Math.abs(index - (bars - 1) / 2) / ((bars - 1) / 2);
    const base = (1 - centre) * h * 0.2;
    const height = Math.max(6, base + Math.sin(t * 1.8 + index * 0.4) * h * 0.06);
    const grad = ctx.createLinearGradient(0, h - height, 0, h);
    grad.addColorStop(0, p[2]);
    grad.addColorStop(1, p[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(x, h - height, gap * 0.64, height);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x, 0, gap * 0.64, height * 0.72);
    ctx.globalAlpha = 1;
  }
}

function tunnel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);

  for (let ring = 0; ring < 16; ring += 1) {
    const beat = (t * 0.22 + ring / 16) % 1;
    const scale = 0.15 + beat * 1.1;
    const width = w * scale;
    const height = h * scale * 0.82;
    const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
    grad.addColorStop(0, p[0]);
    grad.addColorStop(0.5, p[1]);
    grad.addColorStop(1, p[2]);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.55 * (1 - beat * 0.55);
    ctx.lineWidth = 4;
    roundedPath(ctx, -width / 2, -height / 2, width, height, 34);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function bloom(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, p: Palette): void {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let index = 0; index < 6; index += 1) {
    const angle = t * 0.28 + (index / 6) * Math.PI * 2;
    const cx = w / 2 + Math.cos(angle) * w * 0.35;
    const cy = h / 2 + Math.sin(angle * 1.2) * h * 0.32;
    const radius = Math.min(w, h) * (0.22 + 0.05 * Math.sin(t + index));
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, p[index % 3]);
    grad.addColorStop(0.45, p[(index + 1) % 3]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
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
      const time = still ? 0 : (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      if (mode === 'ribbons') ribbons(ctx, width, height, time, palette);
      else if (mode === 'stairs') stairs(ctx, width, height, time, palette);
      else if (mode === 'wave') wave(ctx, width, height, time, palette);
      else if (mode === 'tunnel') tunnel(ctx, width, height, time, palette);
      else bloom(ctx, width, height, time, palette);
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
