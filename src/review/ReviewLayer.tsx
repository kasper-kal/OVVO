/**
 * The review layer — a dev-only annotation tool, and nothing that belongs to the product.
 *
 * Why it exists: pointing at the interface is a hundred times more useful than describing it, and
 * describing it in a message loses the thing being pointed at. So this floats a dot over the app;
 * open it, paste a screenshot, click the picture to drop pins, write beside each one, and save.
 * The image and the notes land in one round's folder under `review/` — `review/desktop/` for this
 * round, `review/mobile/` for the archived phone batch (see `review/README.md`) — and the fix plan
 * is written against them afterwards.
 *
 * Three rules it keeps so it can be deleted without a trace:
 *
 * 1. **No stylesheet.** Everything is inline `style` objects. A `review.css` imported by a
 *    dev-only component would still be emitted into the production CSS, and the class-audit would
 *    then have forty classes to account for that are not part of the design system.
 * 2. **No dictionary entries.** The app's i18n is for travellers; this is a tool for one person
 *    writing notes to themselves, and translating its buttons would be pretending otherwise.
 * 3. **Nothing runs in a build.** `App.tsx` mounts it behind `import.meta.env.DEV`, which Vite
 *    replaces with `false` at build time, so the whole module is dropped from the bundle.
 *
 * Two things it learned the hard way, because a phone is not a small desktop:
 *
 * - The panel is a fixed-position box that used to be placed next to the dot with a 560px cap, so
 *   on a phone its bottom — and the Save button with it — sat past the edge of the screen, with no
 *   way to scroll to it. On a narrow viewport it is now a sheet that fills the screen, with the
 *   body scrolling between a fixed header and a fixed footer, so Save is always on screen.
 * - A 3x phone screenshot is several megabytes of base64, and a large POST can sit in a proxy
 *   forever without ever reaching the dev server. Pictures over `KEEP_BYTES` are re-encoded to a
 *   JPEG that is at most `MAX_EDGE` px on its long edge before they are sent; the notes record both
 *   the original and the sent size so the reduction is never silent.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { readStored, writeStored } from '../lib/storage';

interface Pin {
  id: string;
  /** Fraction of the image's width and height, so a pin survives being opened at any size. */
  x: number;
  y: number;
  comment: string;
}

/**
 * A whole panel rather than a spot: the same fractions as a pin, plus a size, so a box drawn
 * around a card ("these three rows are one control") stays on that card at any image size.
 */
interface Region {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  comment: string;
}

interface Shot {
  id: string;
  /** Base name for the files: the stamp, the route, the width and the theme. */
  name: string;
  dataUrl: string;
  meta: Record<string, unknown>;
  pins: Pin[];
  regions: Region[];
  /** The filename the dev server wrote, once it has. */
  saved?: string;
}

/* 44px, like every other target in this app — being a dev tool is not a reason to break the rule
   the rest of the interface keeps. */
const DOT_SIZE = 44;
const PANEL_WIDTH = 360;
/** Below this the panel becomes a full-height sheet; 360 + the margins does not fit. */
const SHEET_WIDTH = 560;
/** Uploads larger than this are re-encoded; below it the picture is sent exactly as pasted. */
const KEEP_BYTES = 700_000;
/** The long edge of a re-encoded picture. Enough to read 13px UI text, small enough to upload. */
const MAX_EDGE = 1600;
/** A save that has not answered by now is not going to; say so instead of waiting forever. */
const SAVE_TIMEOUT_MS = 20_000;

/**
 * The folder this run saves into, as the dev server chose it (`vite.config.ts` defines it from the
 * same value the middleware was given). The fallback is the same default the plugin has, so a build
 * or a page where the constant did not arrive still names a real folder rather than `undefined`.
 */
const REVIEW_BATCH =
  typeof __REVIEW_BATCH__ === 'undefined' || !__REVIEW_BATCH__ ? 'desktop' : __REVIEW_BATCH__;

/** What `/__review` answers with, before it is trusted. */
interface SaveResult {
  ok?: boolean;
  image?: string;
  /** The folder it was written to — the server's answer, not this module's guess. */
  batch?: string;
  error?: unknown;
}

/** Everything the app knows about the person looking at it — the context a note needs to mean anything. */
function readContext(route: string, settings: { language: string; density: string }, preferences: unknown) {
  const screenInfo = window.screen;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const theme = document.documentElement.dataset.theme ?? 'light';
  return {
    at: new Date().toISOString(),
    route,
    screen: {
      width: screenInfo.width,
      height: screenInfo.height,
      availWidth: screenInfo.availWidth,
      availHeight: screenInfo.availHeight,
      colorDepth: screenInfo.colorDepth,
      orientation: screenInfo.orientation?.type ?? null,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
    },
    device: {
      /* A coarse pointer is the honest test for "this is a phone/tablet", not user-agent sniffing. */
      mobile: coarse,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    },
    appearance: {
      theme,
      contrast: document.documentElement.dataset.contrast ?? 'normal',
      density: settings.density,
      language: settings.language,
    },
    preferences,
  };
}

/** `2026-10-17t18-42-05-departures-390-dark` — sortable, readable, safe as a filename. */
function fileStem(meta: Record<string, unknown>) {
  const at = String(meta.at ?? new Date().toISOString());
  const stamp = at.replace(/[:.]/g, '-').replace('Z', '').toLowerCase();
  const route = String(meta.route ?? '/').replace(/^#/, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'home';
  const width = (meta.viewport as { width?: number } | undefined)?.width ?? 0;
  const theme = (meta.appearance as { theme?: string } | undefined)?.theme ?? 'light';
  return `${stamp}-${route}-${width}-${theme}`;
}

/** Bytes in a data URL, without decoding it. */
function dataUrlBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return 0;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

function kb(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Errors from a dev proxy are as likely to be objects as strings, and `String(object)` is the
 * useless `[object Object]` this used to print. Ask an object for its message, and only then fall
 * back to its JSON.
 */
function explain(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
    try {
      return JSON.stringify(value).slice(0, 220);
    } catch {
      return 'unreadable error';
    }
  }
  return String(value ?? 'unknown error');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('the file could not be read'));
    reader.readAsDataURL(file);
  });
}

/**
 * Re-encode a picture to a JPEG of at most `MAX_EDGE` px on its long edge.
 *
 * PNG screenshots of a phone are 2–4 MB, and base64 makes them a third larger again; that is the
 * size that hangs in a proxy. The reduction is deliberate and reported: the URL is only ever used
 * by this panel, and the notes carry the before and after sizes.
 */
async function shrink(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return { dataUrl, width, height, sourceWidth, sourceHeight };
  /* JPEG has no alpha; screenshots are opaque, and white is what the missing pixels meant. */
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  let quality = 0.86;
  let encoded = canvas.toDataURL('image/jpeg', quality);
  while (dataUrlBytes(encoded) > KEEP_BYTES && quality > 0.55) {
    quality -= 0.1;
    encoded = canvas.toDataURL('image/jpeg', quality);
  }
  return { dataUrl: encoded, width, height, sourceWidth, sourceHeight };
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 70,
  display: 'flex',
  flexDirection: 'column',
  background: '#fffdf8',
  color: '#18181b',
  border: '1px solid #e6e2d8',
  borderRadius: 16,
  boxShadow: '0 18px 44px rgb(0 0 0 / 0.18)',
  font: '13.5px/1.45 system-ui, sans-serif',
  overflow: 'hidden',
  overscrollBehavior: 'contain',
};

const panelHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderBottom: '1px solid #e6e2d8',
  flexShrink: 0,
};

const panelBody: React.CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  padding: '10px 12px',
};

const panelFooter: React.CSSProperties = {
  flexShrink: 0,
  padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
  borderTop: '1px solid #e6e2d8',
  background: '#fffdf8',
};

const quietButton: React.CSSProperties = {
  font: 'inherit',
  padding: '6px 10px',
  borderRadius: 10,
  border: '1px solid #d8d3c8',
  background: '#fff',
  color: '#18181b',
  cursor: 'pointer',
};

/** Tracks the sheet breakpoint; `matchMedia` also fires on rotation and desktop resizing. */
function useNarrow() {
  const query = `(max-width: ${SHEET_WIDTH}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setNarrow(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}

export function ReviewLayer() {
  const location = useLocation();
  const { settings, preferences } = useApp();
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  const [dot, setDot] = useState(() =>
    readStored<{ x: number; y: number }>('review-dot', {
      x: Math.max(8, window.innerWidth - DOT_SIZE - 16),
      y: Math.max(8, window.innerHeight - DOT_SIZE - 96),
    }),
  );
  const [shots, setShots] = useState<Shot[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* Pin drops a numbered point; area drags a box over a whole panel. */
  const [tool, setTool] = useState<'pin' | 'area'>('pin');
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const regionDrag = useRef<{ x: number; y: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const route = `#${location.pathname}${location.search}`;
  const captureMeta = useCallback(
    () => readContext(route, settings, preferences),
    [route, settings, preferences],
  );

  const addFile = useCallback(
    async (file: File) => {
      /* Some pickers hand over an empty type; only a type that is present and wrong is a refusal. */
      if (file.type && !file.type.startsWith('image/')) {
        setStatus(`${file.name || 'That file'} is not an image.`);
        return;
      }
      setStatus('Reading the screenshot…');
      try {
        const original = await readAsDataUrl(file);
        const resized = file.size > KEEP_BYTES ? await shrink(original) : null;
        const meta = captureMeta();
        const shot: Shot = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: fileStem(meta),
          dataUrl: resized ? resized.dataUrl : original,
          meta: {
            ...meta,
            /* Not `image`: the endpoint writes the saved filename under that key too. */
            capture: resized
              ? {
                  sourceBytes: file.size,
                  sentBytes: dataUrlBytes(resized.dataUrl),
                  sourceWidth: resized.sourceWidth,
                  sourceHeight: resized.sourceHeight,
                  sentWidth: resized.width,
                  sentHeight: resized.height,
                  reduced: true,
                }
              : { sourceBytes: file.size, sentBytes: file.size, reduced: false },
          },
          pins: [],
          regions: [],
        };
        setShots((current) => [...current, shot]);
        setActiveId(shot.id);
        setStatus(
          resized
            ? `Added: ${kb(file.size)} resized to ${kb(dataUrlBytes(resized.dataUrl))} so it can upload. Pin a spot, or select a panel.`
            : 'Added. Pin a spot, or select a panel.',
        );
        window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0 }));
      } catch (error) {
        setStatus(`That screenshot could not be read: ${explain(error)}`);
      }
    },
    [captureMeta],
  );

  /* Cmd/Ctrl+V while the panel is open: the usual way a screenshot arrives on a desktop. */
  useEffect(() => {
    if (!open) return undefined;
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items ?? [];
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        void addFile(file);
        return;
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, addFile]);

  /* Escape closes the panel, and on a phone the page behind it does not scroll under the sheet. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !narrow) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, narrow]);

  /* The dot: drag to move, click to open. A drag that moved further than a few pixels is not a click. */
  const onDotDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      dx: event.clientX - dot.x,
      dy: event.clientY - dot.y,
      moved: false,
    };
  };
  const onDotMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start) return;
    const x = Math.min(Math.max(8, event.clientX - start.dx), window.innerWidth - DOT_SIZE - 8);
    const y = Math.min(Math.max(8, event.clientY - start.dy), window.innerHeight - DOT_SIZE - 8);
    if (Math.abs(event.clientX - start.dx - dot.x) > 4 || Math.abs(event.clientY - start.dy - dot.y) > 4) {
      start.moved = true;
    }
    setDot({ x, y });
  };
  const onDotUp = () => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    writeStored('review-dot', dot);
    if (!start.moved) setOpen((value) => !value);
  };

  const active = shots.find((shot) => shot.id === activeId) ?? shots[0];

  /** Where a pointer is on the picture, as fractions — the space pins and regions are stored in. */
  const imagePoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return {
      x: clamp((event.clientX - box.left) / box.width),
      y: clamp((event.clientY - box.top) / box.height),
    };
  };

  const startRegion = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool !== 'area') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = imagePoint(event);
    regionDrag.current = point;
    setDraft({ x: point.x, y: point.y, w: 0, h: 0 });
  };

  const moveRegion = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = regionDrag.current;
    if (!start) return;
    const point = imagePoint(event);
    setDraft({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    });
  };

  const finishRegion = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = regionDrag.current;
    regionDrag.current = null;
    setDraft(null);
    if (!start || !active) return;
    const point = imagePoint(event);
    const box = {
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    };
    /* A tap in area mode is not a selection; no panel is 2% of the picture in both directions. */
    if (box.w < 0.02 || box.h < 0.02) {
      setStatus('Drag a box over the panel you mean; a tap is too small to select.');
      return;
    }
    const region: Region = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...box,
      comment: '',
    };
    setShots((current) =>
      current.map((shot) => (shot.id === active.id ? { ...shot, regions: [...shot.regions, region] } : shot)),
    );
    window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }));
  };

  const addPin = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!active) return;
    const box = event.currentTarget.getBoundingClientRect();
    const pin: Pin = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: Number(((event.clientX - box.left) / box.width).toFixed(4)),
      y: Number(((event.clientY - box.top) / box.height).toFixed(4)),
      comment: '',
    };
    setShots((current) => current.map((shot) => (shot.id === active.id ? { ...shot, pins: [...shot.pins, pin] } : shot)));
    /* The new field is at the end of a scrolling sheet; bring it into view so it can be typed in. */
    window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }));
  };

  const writePin = (pinId: string, comment: string) => {
    if (!active) return;
    setShots((current) =>
      current.map((shot) =>
        shot.id === active.id
          ? { ...shot, pins: shot.pins.map((pin) => (pin.id === pinId ? { ...pin, comment } : pin)) }
          : shot,
      ),
    );
  };

  const writeRegion = (regionId: string, comment: string) => {
    if (!active) return;
    setShots((current) =>
      current.map((shot) =>
        shot.id === active.id
          ? { ...shot, regions: shot.regions.map((region) => (region.id === regionId ? { ...region, comment } : region)) }
          : shot,
      ),
    );
  };

  const save = async (shot: Shot) => {
    setBusy(true);
    setStatus(`Saving ${kb(dataUrlBytes(shot.dataUrl))}…`);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
    try {
      const response = await fetch('/__review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: shot.name,
          image: shot.dataUrl,
          meta: shot.meta,
          pins: shot.pins.filter((pin) => pin.comment.trim()),
          regions: shot.regions.filter((region) => region.comment.trim()),
        }),
        signal: controller.signal,
      });
      const text = await response.text();
      let result: SaveResult | null = null;
      try {
        result = JSON.parse(text) as SaveResult;
      } catch {
        result = null;
      }
      if (!response.ok || !result) {
        throw new Error(
          `the dev server answered ${response.status}${text.trim() ? `: ${text.trim().slice(0, 160)}` : ''}`,
        );
      }
      if (!result.ok) throw new Error(explain(result.error));
      setShots((current) => current.map((item) => (item.id === shot.id ? { ...item, saved: result?.image } : item)));
      setStatus(`Saved to review/${result.batch ?? REVIEW_BATCH}/${result.image}`);
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? `no answer after ${SAVE_TIMEOUT_MS / 1000}s, so the upload did not reach the dev server`
          : explain(error);
      setStatus(`Not saved: ${message}`);
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
    }
  };

  const discard = (shot: Shot) => {
    setShots((current) => current.filter((item) => item.id !== shot.id));
    setActiveId(null);
    setStatus(null);
  };

  /* The panel hangs beside the dot on a desktop, but never past the bottom of the window. */
  const desktopTop = Math.max(12, Math.min(dot.y + DOT_SIZE + 8, window.innerHeight - 320));

  return (
    <>
      <button
        type="button"
        aria-label="Review notes"
        title={`Review notes: saving to review/${REVIEW_BATCH}. Drag to move, click to open`}
        onPointerDown={onDotDown}
        onPointerMove={onDotMove}
        onPointerUp={onDotUp}
        style={{
          position: 'fixed',
          left: dot.x,
          top: dot.y,
          zIndex: 61,
          width: DOT_SIZE,
          height: DOT_SIZE,
          padding: 0,
          borderRadius: '50%',
          border: '1px solid rgb(255 255 255 / 0.5)',
          background: 'rgb(255 126 103 / 0.92)',
          boxShadow: '0 6px 18px rgb(0 0 0 / 0.25)',
          color: '#fff',
          cursor: 'grab',
          touchAction: 'none',
          display: 'grid',
          placeItems: 'center',
          font: '600 11px/1 system-ui, sans-serif',
        }}
      >
        {shots.length ? shots.length : ''}
        {!shots.length ? (
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff' }} />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Review notes"
          aria-modal={narrow ? 'true' : undefined}
          style={{
            ...panelStyle,
            ...(narrow
              ? {
                  left: 8,
                  right: 8,
                  top: 8,
                  width: 'auto',
                  height: 'calc(100dvh - 16px)',
                }
              : {
                  width: PANEL_WIDTH,
                  left: Math.min(Math.max(8, dot.x), Math.max(8, window.innerWidth - PANEL_WIDTH - 16)),
                  top: desktopTop,
                  maxHeight: window.innerHeight - desktopTop - 12,
                }),
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            for (const file of Array.from(event.dataTransfer.files)) {
              if (file.type.startsWith('image/')) void addFile(file);
            }
          }}
        >
          <div style={panelHeader}>
            {/* The folder is on the panel, not just in the README: the dot saves into one round at a
                time, and the round it is on is the one thing a capture cannot be filed wrong by. */}
            <span style={{ flex: 1, display: 'grid', gap: 2 }}>
              <strong>Review notes</strong>
              <span style={{ font: '500 11px/1.3 system-ui, sans-serif', color: '#57544b' }}>
                saving to review/{REVIEW_BATCH}
              </span>
            </span>
            <button type="button" style={quietButton} onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div ref={bodyRef} style={panelBody}>
            <p style={{ margin: '0 0 8px', color: '#57544b' }}>
              {narrow
                ? 'Choose a screenshot below, then pin a spot or drag a box around a panel, and say what you think beside it.'
                : 'Paste a screenshot (⌘/Ctrl+V) or drop an image here, or choose a file. Pin a spot, or drag a box around a whole panel, then say what you think beside it.'}
            </p>

            {/* A phone has no clipboard image and no drop target, so it needs a picker. */}
            <label
              style={{
                ...quietButton,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 44,
                marginBottom: 10,
                cursor: 'pointer',
              }}
            >
              Add a screenshot
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  for (const file of files) void addFile(file);
                  event.target.value = '';
                }}
              />
            </label>

            {shots.length > 1 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {shots.map((shot, index) => (
                  <button
                    key={shot.id}
                    type="button"
                    style={{ ...quietButton, fontWeight: shot.id === active?.id ? 700 : 400 }}
                    onClick={() => setActiveId(shot.id)}
                  >
                    {index + 1}
                    {shot.saved ? ' ✓' : ''}
                  </button>
                ))}
              </div>
            ) : null}

            {active ? (
              <>
                <div role="group" aria-label="Annotation tool" style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {(['pin', 'area'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={tool === value}
                      style={{
                        ...quietButton,
                        flex: 1,
                        minHeight: 40,
                        background: tool === value ? '#18181b' : '#fff',
                        color: tool === value ? '#fffdf8' : '#18181b',
                      }}
                      onClick={() => setTool(value)}
                    >
                      {value === 'pin' ? 'Pin a spot' : 'Select an area'}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    position: 'relative',
                    border: '1px solid #e6e2d8',
                    borderRadius: 10,
                    overflow: 'hidden',
                    /* In area mode the drag belongs to the box, not to the sheet's scrolling. */
                    touchAction: tool === 'area' ? 'none' : 'auto',
                    userSelect: 'none',
                  }}
                  onPointerDown={startRegion}
                  onPointerMove={moveRegion}
                  onPointerUp={finishRegion}
                  onPointerCancel={() => {
                    regionDrag.current = null;
                    setDraft(null);
                  }}
                >
                  <img
                    src={active.dataUrl}
                    alt="Pasted screenshot"
                    onClick={tool === 'pin' ? addPin : undefined}
                    style={{ display: 'block', width: '100%', cursor: 'crosshair' }}
                  />

                  {active.regions.map((region, index) => (
                    <span
                      key={region.id}
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: `${region.x * 100}%`,
                        top: `${region.y * 100}%`,
                        width: `${region.w * 100}%`,
                        height: `${region.h * 100}%`,
                        border: '1.5px solid #2563eb',
                        background: 'rgb(59 130 246 / 0.22)',
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: -2,
                          top: -2,
                          transform: 'translateY(-100%)',
                          padding: '0 5px',
                          borderRadius: '6px 6px 6px 0',
                          background: '#2563eb',
                          color: '#fff',
                          font: '700 10px/16px system-ui, sans-serif',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Area {index + 1}
                      </span>
                    </span>
                  ))}
                  {active.pins.map((pin, index) => (
                    <span
                      key={pin.id}
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: `${pin.x * 100}%`,
                        top: `${pin.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        minWidth: 20,
                        height: 20,
                        padding: '0 5px',
                        borderRadius: 10,
                        background: '#ff7e67',
                        color: '#fff',
                        font: '700 11px/20px system-ui, sans-serif',
                        textAlign: 'center',
                        boxShadow: '0 2px 6px rgb(0 0 0 / .3)',
                        pointerEvents: 'none',
                      }}
                    >
                      {index + 1}
                    </span>
                  ))}

                  {draft ? (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: `${draft.x * 100}%`,
                        top: `${draft.y * 100}%`,
                        width: `${draft.w * 100}%`,
                        height: `${draft.h * 100}%`,
                        border: '1.5px dashed #2563eb',
                        background: 'rgb(59 130 246 / 0.14)',
                        pointerEvents: 'none',
                      }}
                    />
                  ) : null}
                </div>

                <p style={{ margin: '8px 0', color: '#57544b' }}>
                  {String(active.meta.route)} · {String((active.meta.viewport as { width?: number })?.width)}px ·{' '}
                  {String((active.meta.appearance as { theme?: string })?.theme)} ·{' '}
                  {String((active.meta.device as { mobile?: boolean })?.mobile ? 'mobile' : 'desktop')}
                </p>

                {active.pins.map((pin, index) => (
                  <label key={pin.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>{index + 1}</span>
                    <input
                      value={pin.comment}
                      onChange={(event) => writePin(pin.id, event.target.value)}
                      placeholder="What do you think of this?"
                      enterKeyHint="done"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 40,
                        font: 'inherit',
                        padding: '6px 8px',
                        borderRadius: 10,
                        border: '1px solid #d8d3c8',
                      }}
                    />
                  </label>
                ))}

                {active.regions.map((region, index) => (
                  <label key={region.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#2563eb', whiteSpace: 'nowrap' }}>
                      Area {index + 1}
                    </span>
                    <input
                      value={region.comment}
                      onChange={(event) => writeRegion(region.id, event.target.value)}
                      placeholder="What is wrong with this whole panel?"
                      enterKeyHint="done"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 40,
                        font: 'inherit',
                        padding: '6px 8px',
                        borderRadius: 10,
                        border: '1px solid #d8d3c8',
                      }}
                    />
                  </label>
                ))}
              </>
            ) : null}
          </div>

          <div style={panelFooter}>
            {active ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={busy || Boolean(active.saved)}
                  style={{
                    ...quietButton,
                    flex: 1,
                    minHeight: 44,
                    background: '#18181b',
                    color: '#fffdf8',
                    opacity: busy || active.saved ? 0.7 : 1,
                  }}
                  onClick={() => void save(active)}
                >
                  {active.saved ? 'Saved' : busy ? 'Saving…' : `Save to review/${REVIEW_BATCH}`}
                </button>
                <button type="button" style={{ ...quietButton, minHeight: 44 }} onClick={() => discard(active)}>
                  Discard
                </button>
              </div>
            ) : null}

            {status ? (
              <p
                role="status"
                aria-live="polite"
                style={{ margin: active ? '8px 0 0' : 0, color: '#57544b', wordBreak: 'break-word' }}
              >
                {status}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
