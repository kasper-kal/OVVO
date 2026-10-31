/**
 * **One layer, between the wallpaper and the cards.**
 *
 * The rain, the snow, the pepernoten, the Christmas lights and the new year's fireworks are all the
 * same thing to the page: a drawing that lives *behind* the cards and *in front of* the background,
 * so the picture is still the picture and the type still sits on its own surface. That place is a
 * `position: fixed` canvas at the shell's first stacking level, with the body of the app lifted one
 * level above it (`.app-atmosphere` in `styles/base.css`).
 *
 * Nothing here is a setting, and nothing here asks for anything. A traveller who never opens the
 * page on the fifth of December, or in the rain, never learns that it exists — and one who does sees
 * it for as long as it lasts, on any screen, without a control to turn it off. Reduced motion and
 * super energy saving both mean **no canvas at all**: the first because movement is the whole point,
 * the second because a decoration is not "when does the bus go".
 *
 * The weather comes from `lib/atmosphere`, which is the only part that talks to the network, and it
 * loses to the calendar: a white Christmas stays a white Christmas even if it is raining outside.
 */

import { useEffect, useRef, useState } from 'react';
import { calendarMood, readWeather, type Mood } from '../../lib/atmosphere';

type Flake = {
  x: number;
  y: number;
  speed: number;
  drift: number;
  size: number;
  phase: number;
  spin: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  colour: string;
};

type Glow = { x: number; y: number; speed: number; size: number; phase: number };

/** The firework colours: the app's own coral and sage, plus warm gold and a winter blue. */
const PALETTE = ['#ff7e67', '#ffd166', '#ffedc2', '#c6f1d6', '#8ecae6', '#ffb4a2'];

const FLAKES: Record<string, number> = { rain: 130, snow: 90, christmas: 60, pepernoten: 55 };

/**
 * The drawing itself, in one place, with its own life.
 *
 * It returns a `stop` rather than taking a dependency on React: the component's only job is to mount
 * a canvas and call this, and the clean-up it hands back is what stops the frame loop, the resize
 * listener and the visibility listener together.
 */
function createScene(canvas: HTMLCanvasElement, mood: Mood) {
  const context = canvas.getContext('2d');
  if (!context) return { stop: () => {} };

  let width = 0;
  let height = 0;
  let frame = 0;
  let running = true;
  let clock = 0;
  let nextBurst = 40;

  const flakes: Flake[] = [];
  const sparks: Spark[] = [];
  const glows: Glow[] = [];

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const seed = () => {
    flakes.length = 0;
    const count = FLAKES[mood] ?? 0;
    for (let index = 0; index < count; index += 1) {
      flakes.push({
        x: Math.random() * Math.max(width, 1),
        y: Math.random() * Math.max(height, 1),
        speed: mood === 'rain' ? 9 + Math.random() * 7 : 0.3 + Math.random() * 0.9,
        drift: mood === 'rain' ? -0.9 : 0.2 + Math.random() * 0.6,
        size:
          mood === 'rain'
            ? 9 + Math.random() * 9
            : mood === 'pepernoten'
              ? 2.4 + Math.random() * 1.6
              : 1 + Math.random() * 1.9,
        phase: Math.random() * Math.PI * 2,
        spin: Math.random() * Math.PI * 2,
      });
    }

    glows.length = 0;
    const glowCount = mood === 'lights' ? 26 : mood === 'christmas' ? 14 : 0;
    for (let index = 0; index < glowCount; index += 1) {
      glows.push({
        x: Math.random() * Math.max(width, 1),
        y: Math.random() * Math.max(height, 1),
        speed: 0.12 + Math.random() * 0.3,
        size: 2 + Math.random() * 6,
        phase: Math.random() * Math.PI * 2,
      });
    }
  };

  const burst = () => {
    const originX = width * (0.15 + Math.random() * 0.7);
    const originY = height * (0.12 + Math.random() * 0.34);
    const colour = PALETTE[Math.floor(Math.random() * PALETTE.length)] ?? '#ffd166';
    const count = 42 + Math.floor(Math.random() * 18);
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.2;
      const speed = 0.6 + Math.random() * 2.6;
      sparks.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 40,
        max: 100,
        size: 1.1 + Math.random() * 1.4,
        colour,
      });
    }
  };

  const drawFalling = () => {
    if (mood === 'rain') {
      context.strokeStyle = 'rgba(126, 148, 180, 0.55)';
      context.lineWidth = 1.2;
      context.lineCap = 'round';
      for (const drop of flakes) {
        context.beginPath();
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x + drop.drift * 2, drop.y + drop.size);
        context.stroke();
        drop.y += drop.speed;
        drop.x += drop.drift;
        if (drop.y > height + 30) {
          drop.y = -30;
          drop.x = Math.random() * width;
        }
        if (drop.x < -30) drop.x = width + 30;
      }
      return;
    }

    if (mood === 'pepernoten') {
      for (const crumb of flakes) {
        context.save();
        context.translate(crumb.x, crumb.y);
        context.rotate(crumb.spin + clock * 0.03);
        context.fillStyle = '#8a5a34';
        context.fillRect(-crumb.size, -crumb.size * 0.7, crumb.size * 2, crumb.size * 1.4);
        context.restore();
        crumb.y += crumb.speed * 1.7;
        crumb.x += Math.sin(crumb.phase + clock * 0.02) * crumb.drift;
        crumb.spin += 0.012;
        if (crumb.y > height + 12) {
          crumb.y = -12;
          crumb.x = Math.random() * width;
        }
      }
      return;
    }

    /* Snow, and the quieter snow of Christmas Day: white with a soft dark edge, so it also reads on
       a cream page and not only over a photograph. */
    context.shadowColor = 'rgba(70, 80, 100, 0.45)';
    context.shadowBlur = 3;
    context.fillStyle = 'rgba(255, 255, 255, 0.92)';
    for (const flake of flakes) {
      context.beginPath();
      context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      context.fill();
      flake.y += flake.speed;
      flake.x += Math.sin(flake.phase + clock * 0.012) * flake.drift;
      if (flake.y > height + 10) {
        flake.y = -10;
        flake.x = Math.random() * width;
      }
      if (flake.x > width + 10) flake.x = -10;
      if (flake.x < -10) flake.x = width + 10;
    }
    context.shadowBlur = 0;
  };

  const drawLights = () => {
    for (const glow of glows) {
      const alpha = 0.22 + 0.24 * (0.5 + 0.5 * Math.sin(glow.phase + clock * 0.02));
      context.beginPath();
      context.fillStyle = `rgba(255, 202, 128, ${alpha.toFixed(3)})`;
      context.shadowColor = 'rgba(255, 188, 96, 0.55)';
      context.shadowBlur = 12;
      context.arc(glow.x, glow.y, glow.size, 0, Math.PI * 2);
      context.fill();
      glow.y -= glow.speed;
      if (glow.y < -14) {
        glow.y = height + 14;
        glow.x = Math.random() * width;
      }
    }
    context.shadowBlur = 0;
  };

  const drawFireworks = () => {
    if (clock > nextBurst) {
      burst();
      nextBurst = clock + 45 + Math.random() * 60;
    }
    for (let index = sparks.length - 1; index >= 0; index -= 1) {
      const spark = sparks[index];
      if (!spark) continue;
      spark.vy += 0.045;
      spark.vx *= 0.992;
      spark.vy *= 0.992;
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 1;
      if (spark.life <= 0) {
        sparks.splice(index, 1);
        continue;
      }
      context.globalAlpha = Math.max(0, spark.life / spark.max);
      context.fillStyle = spark.colour;
      context.beginPath();
      context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  };

  const render = () => {
    if (!running) return;
    clock += 1;
    context.clearRect(0, 0, width, height);

    if (mood === 'fireworks') drawFireworks();
    else {
      drawFalling();
      if (mood === 'christmas' || mood === 'lights') drawLights();
    }

    frame = window.requestAnimationFrame(render);
  };

  const onResize = () => {
    resize();
    seed();
  };

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      window.cancelAnimationFrame(frame);
      return;
    }
    if (running) return;
    running = true;
    frame = window.requestAnimationFrame(render);
  };

  resize();
  seed();
  frame = window.requestAnimationFrame(render);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    stop: () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

/**
 * Whether the app has asked for stillness, or for the cheapest possible screen.
 *
 * Both are written on the root element rather than passed down, because the atmosphere is drawn by
 * the shell and the settings that decide it belong to the app: reading the two attributes keeps this
 * component free of the whole settings object, and the observer means a change takes effect at once,
 * the same way the rest of the app answers them.
 */
function useRootFlag(name: 'motion' | 'power'): boolean {
  const read = () => {
    const value = document.documentElement.dataset[name];
    return name === 'motion' ? value === 'reduced' : value === 'super';
  };
  const [on, setOn] = useState(read);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setOn(read());
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-power'] });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return on;
}

export function Atmosphere() {
  const [calendar, setCalendar] = useState<Mood | null>(() => calendarMood());
  const [weather, setWeather] = useState<'rain' | 'snow' | null>(null);
  const reduced = useRootFlag('motion');
  const saving = useRootFlag('power');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* The calendar is re-read on a slow clock, so a page left open across ten in the evening starts
     celebrating by itself. A minute is fine: nothing here is due at a second. */
  useEffect(() => {
    const id = window.setInterval(() => setCalendar(calendarMood()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  /* The sky is only asked when the calendar has nothing to say — and once per session, because the
     answer is cached in `readWeather`. */
  useEffect(() => {
    if (calendarMood()) return;
    let alive = true;
    readWeather().then((answer) => {
      if (alive) setWeather(answer);
    });
    return () => {
      alive = false;
    };
  }, []);

  const mood = calendar ?? weather;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mood) return;
    const scene = createScene(canvas, mood);
    return () => scene.stop();
  }, [mood]);

  if (!mood || reduced || saving) return null;
  return <canvas ref={canvasRef} className="app-atmosphere" aria-hidden="true" />;
}
