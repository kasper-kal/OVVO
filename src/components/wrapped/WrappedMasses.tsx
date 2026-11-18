import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Chapter } from '../../lib/wrappedDeck';
import { lookFor } from '../../lib/wrappedLook';

/*
 * **The mass is a staircase, not a silhouette.**
 *
 * Every body in this deck is built the same way: a run of boxes that climbs, or a ring of boxes that
 * turns, so the outline is a set of steps rather than a curve. That is what the reference does. A
 * smooth cylinder reads as a drawing of a shape; a stack of shrinking slabs reads as an object that
 * was photographed, because the steps catch the key light one after another and drop a hard shadow
 * from each onto the one below it.
 *
 * After the body is built it is **measured and fitted**, not placed by hand. The screen box of the
 * whole group is projected through the live camera and scaled until its long side runs past the
 * frame by a fifth, then pushed off-centre along that axis, so at least two edges cut it. The
 * measured box is written onto the host element as `data-mass`, and the number of steps as
 * `data-steps`, which is how `scripts/check-wrapped-scenes.mjs` can prove the crop instead of
 * trusting a stylesheet inset.
 *
 * The camera is the only thing that moves the picture: a slow drift and a one-second entry nudge.
 * Nothing here holds a word or a number, so the sentence is always drawn above the object.
 */

type Piece = {
  mesh: THREE.Object3D;
  y: number;
  phase: number;
  amp: number;
  spin: number;
  rotZ: number;
};

type Built = { group: THREE.Group; pieces: Piece[]; steps: number };

const TAU = Math.PI * 2;

function shade(colour: string, mix: number, towards = '#000000'): string {
  return new THREE.Color(colour).lerp(new THREE.Color(towards), mix).getStyle();
}

function box(
  w: number,
  h: number,
  d: number,
  colour: string,
  metalness = 0.14,
  roughness = 0.4,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), metalness, roughness }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function add(built: Built, mesh: THREE.Object3D, opts: { phase?: number; amp?: number; spin?: number } = {}): void {
  built.group.add(mesh);
  built.pieces.push({
    mesh,
    y: mesh.position.y,
    phase: opts.phase ?? Math.random() * TAU,
    amp: opts.amp ?? 0.1,
    spin: opts.spin ?? 0.03,
    rotZ: mesh.rotation.z,
  });
}

/*
 * **One run of steps.** The workhorse: a bar that climbs in one direction while it shrinks, which is
 * a staircase seen from the side. Every oval, capsule and ribbon the old file used is one of these
 * now, so no chapter keeps a smooth edge.
 */
function slabs(
  built: Built,
  o: {
    count: number;
    w: number;
    h: number;
    d: number;
    x?: number;
    y?: number;
    z?: number;
    dx?: number;
    dy?: number;
    dz?: number;
    shrink?: number;
    tilt?: number;
    yaw?: number;
    colour: string;
    accent?: string;
    amp?: number;
    spin?: number;
  },
): void {
  for (let i = 0; i < o.count; i += 1) {
    const scale = Math.max(0.2, 1 - (o.shrink ?? 0) * i);
    const tone = o.accent && i % 2 === 1 ? o.accent : o.colour;
    const mesh = box(o.w * scale, o.h * scale, o.d * scale, shade(tone, i * 0.02));
    mesh.position.set(
      (o.x ?? 0) + (o.dx ?? 0) * i,
      (o.y ?? 0) + (o.dy ?? 0) * i,
      (o.z ?? 0) + (o.dz ?? 0) * i,
    );
    mesh.rotation.set(0, (o.yaw ?? 0) * i, (o.tilt ?? 0) * i * (i % 2 === 0 ? 1 : -1));
    add(built, mesh, { amp: o.amp ?? 0.06, spin: o.spin ?? 0.02, phase: i * 0.55 });
  }
  built.steps += o.count;
}

/* A ring drawn as boxes standing shoulder to shoulder: a stepped circle, never a torus. */
function stairRing(
  built: Built,
  o: {
    x: number;
    y: number;
    z?: number;
    radius: number;
    count: number;
    w: number;
    h: number;
    d: number;
    colour: string;
    accent?: string;
    tilt?: number;
    amp?: number;
  },
): void {
  for (let i = 0; i < o.count; i += 1) {
    const theta = (i / o.count) * TAU;
    const mesh = box(o.w, o.h, o.d, o.accent && i % 2 === 1 ? o.accent : o.colour);
    mesh.position.set(
      o.x + Math.cos(theta) * o.radius,
      o.y + Math.sin(theta) * o.radius,
      o.z ?? 0,
    );
    mesh.rotation.set(0, 0, theta + (o.tilt ?? 0));
    add(built, mesh, { amp: o.amp ?? 0.04, spin: 0.03, phase: i * 0.4 });
  }
  built.steps += o.count;
}

/* A ball made of stacked plates of falling width: the old sphere, stepped. */
function blob(
  built: Built,
  o: { x: number; y: number; z?: number; r: number; count: number; colour: string; accent?: string },
): void {
  for (let i = 0; i < o.count; i += 1) {
    const t = o.count === 1 ? 0 : (i / (o.count - 1)) * 2 - 1;
    const half = Math.sqrt(Math.max(0.05, 1 - t * t));
    const mesh = box(o.r * 2 * half, (o.r * 2) / o.count * 1.08, o.r * 1.85 * half, o.accent ?? o.colour);
    mesh.position.set(o.x, o.y + t * o.r, o.z ?? 0);
    mesh.rotation.y = t * 0.22;
    add(built, mesh, { amp: 0.05, spin: 0.012, phase: i * 0.3 });
  }
  built.steps += o.count;
}

function build(chapter: Chapter): Built {
  const built: Built = { group: new THREE.Group(), pieces: [], steps: 0 };
  const [base, accent] = lookFor(chapter.id).mass;
  const deep = shade(base, 0.35);

  switch (chapter.id) {
    case 'cover': {
      /* Two staircases crossing the top and the bottom of the frame, in opposite directions. */
      slabs(built, { count: 10, w: 3.4, h: 3.8, d: 1.6, x: -13, y: 4.6, dx: 2.9, dy: -0.34, shrink: 0.02, tilt: 0.02, colour: base });
      slabs(built, { count: 9, w: 3.0, h: 3.2, d: 1.4, x: -12, y: -4.8, dx: 2.9, dy: 0.28, shrink: 0.02, tilt: -0.02, colour: accent });
      break;
    }

    case 'total': {
      /* Tickets, as one column that starts above the frame so the ceiling cuts it. */
      slabs(built, { count: 7, w: 5.4, h: 1.5, d: 2.6, x: 0.6, y: 6.6, dy: -1.45, shrink: 0.02, colour: base, accent, tilt: 0.03 });
      break;
    }

    case 'name': {
      stairRing(built, { x: 4.0, y: 5.8, radius: 3.4, count: 14, w: 1.6, h: 1.05, d: 1.2, colour: base, accent, tilt: 0.24 });
      slabs(built, { count: 4, w: 5.2, h: 1.25, d: 0.9, x: -4.6, y: 6.4, dy: -1.2, shrink: 0.07, colour: accent, tilt: 0.02 });
      break;
    }

    case 'map': {
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          const height = 0.7 + ((row + col) % 3) * 0.7;
          const tile = box(2.3, height, 1.8, shade(base, ((row + col) % 3) * 0.16));
          tile.position.set(-6.4 + col * 2.6, -5.2 + height / 2, -1.6 + row * 1.2);
          add(built, tile, { amp: 0.03, spin: 0.01, phase: row + col });
          built.steps += 1;
        }
      }
      for (let i = 0; i < 6; i += 1) {
        const pin = box(0.42, 0.42, 0.42, accent);
        pin.position.set(-6 + i * 2.3, -1.2 + Math.sin(i * 1.9) * 1.6, 0.8);
        add(built, pin, { amp: 0.14, spin: 0.2, phase: i * 0.9 });
        built.steps += 1;
      }
      break;
    }

    case 'distance': {
      slabs(built, { count: 11, w: 3.2, h: 3.4, d: 1.6, x: -13, y: 3.2, dx: 2.8, dy: 0.3, shrink: 0.015, tilt: 0.02, colour: base, accent });
      slabs(built, { count: 9, w: 2.8, h: 2.6, d: 1.4, x: -12, y: -6.4, dx: 2.8, dy: 0.34, shrink: 0.02, tilt: -0.02, colour: deep });
      break;
    }

    case 'pair': {
      slabs(built, { count: 5, w: 6.2, h: 1.0, d: 2.8, x: 0.4, y: 6.6, dy: -1.1, shrink: 0.03, colour: base, accent, tilt: 0.03 });
      slabs(built, { count: 5, w: 6.2, h: 1.0, d: 2.8, x: -0.4, y: -6.6, dy: 1.1, shrink: 0.03, colour: accent, tilt: -0.03 });
      break;
    }

    case 'origin': {
      /* A totem of slabs, each one a little smaller and further round: read as a stack of cards. */
      slabs(built, { count: 6, w: 5.6, h: 1.9, d: 3.2, x: 0.8, y: 7.4, dy: -1.85, shrink: 0.09, yaw: 0.06, colour: base, accent });
      const back = box(4.2, 6.2, 2.2, shade(base, 0.28));
      back.position.set(-5.6, 6.8, -3);
      back.rotation.set(0.18, 0.5, 0.1);
      add(built, back, { amp: 0.1, spin: 0.04, phase: 2 });
      built.steps += 1;
      break;
    }

    case 'hour': {
      /* A tunnel: four stepped rings, each smaller and further away than the one in front of it. */
      for (let i = 0; i < 5; i += 1) {
        stairRing(built, {
          x: 0,
          y: 0.6,
          z: -6 + i * 1.5,
          radius: 4.6 - i * 0.42,
          count: 16,
          w: 1.5,
          h: 0.42,
          d: 0.42,
          colour: i % 2 === 0 ? base : accent,
          tilt: i * 0.1,
        });
      }
      break;
    }

    case 'direct': {
      slabs(built, { count: 7, w: 4.0, h: 1.15, d: 2.6, x: -7.2, y: -6.6, dx: 2.3, dy: 1.1, shrink: 0.02, yaw: -0.1, colour: base, accent });
      break;
    }

    case 'longest': {
      slabs(built, { count: 12, w: 2.2, h: 0.62, d: 2.8, x: -13, y: -3.6, dx: 2.2, dy: -0.06, shrink: 0.0, colour: base, accent });
      const horizon = box(26, 0.2, 0.6, accent);
      horizon.position.set(0, -1.2, -2);
      add(built, horizon, { amp: 0.01, spin: 0 });
      built.steps += 1;
      break;
    }

    case 'look': {
      slabs(built, { count: 10, w: 2.8, h: 1.8, d: 1.4, x: -12.5, y: 6.2, dx: 2.6, dy: 0.3, shrink: 0.02, tilt: 0.02, colour: accent, amp: 0.1 });
      break;
    }

    case 'ranked': {
      /*
       * Five stepped columns, tallest first: the ranking itself, standing in a row so wide that the
       * frame cuts both ends off it. The columns are one colour on purpose - the five names and
       * their counts are set over this, and a bright slab behind a row would take the row's reading
       * away with it.
       */
      const heights = [2.6, 2.2, 1.9, 1.5, 1.1];
      heights.forEach((height, i) => {
        slabs(built, {
          count: 4,
          w: 1.8,
          h: height / 4,
          d: 1.6,
          x: -8.4 + i * 4.2,
          y: -1.4 + height / 2,
          dy: -(height / 4) * 0.94,
          shrink: 0.04,
          colour: shade(base, i * 0.05),
          amp: 0.04,
        });
      });
      break;
    }

    case 'day': {
      /* One day, one shaft: a single stepped column that runs past the top and the bottom. */
      slabs(built, {
        count: 9,
        w: 1.7,
        h: 1.5,
        d: 1.5,
        y: -6.4,
        dy: 1.55,
        shrink: 0.02,
        tilt: 0.012,
        colour: base,
        amp: 0.06,
      });
      break;
    }

    case 'eras': {
      for (let i = 0; i < 3; i += 1) {
        slabs(built, {
          count: 5,
          w: 3.2,
          h: 2.2,
          d: 1.4,
          x: -4.6 + i * 4.4,
          y: 7.0,
          dy: -1.9,
          shrink: 0.07,
          yaw: 0.03 - i * 0.03,
          colour: shade(base, i * 0.16),
        });
      }
      break;
    }

    case 'lines': {
      const heights = [4.4, 3.2, 5.2, 2.8, 4.0, 5.6, 3.0, 3.8, 4.8];
      heights.forEach((shaft, i) => {
        slabs(built, {
          count: 3,
          w: 1.5,
          h: shaft / 3,
          d: 1.5,
          x: -6.6 + i * 1.7,
          y: 7.2,
          dy: -(shaft / 3) * 0.94,
          shrink: 0.02,
          colour: i % 2 === 0 ? base : shade(base, 0.3),
          accent: i % 2 === 0 ? accent : undefined,
          amp: 0.05,
        });
      });
      break;
    }

    case 'awards': {
      const medals = [
        { x: -4.6, y: -4.2, r: 3.2, z: 1.2, count: 14 },
        { x: 1.8, y: -5.2, r: 2.6, z: -0.6, count: 12 },
        { x: 5.8, y: -4.6, r: 3.3, z: 1.8, count: 16 },
      ];
      medals.forEach((medal, i) => {
        stairRing(built, {
          x: medal.x,
          y: medal.y,
          z: medal.z,
          radius: medal.r,
          count: medal.count,
          w: 0.7,
          h: 1.15,
          d: 1.15,
          colour: i === 1 ? accent : base,
          accent: i === 1 ? base : shade(base, 0.3),
        });
        const core = box(medal.r * 1.2, 0.7, medal.r * 1.2, i === 1 ? accent : shade(base, 0.2));
        core.position.set(medal.x, medal.y, medal.z);
        add(built, core, { amp: 0.1, spin: 0.04, phase: i });
        built.steps += 1;
      });
      break;
    }

    case 'bookends': {
      blob(built, { x: -4.4, y: -1.2, z: -3, r: 2.5, count: 11, colour: accent });
      const hills = [2.6, 3.6, 3.0, 4.4, 3.4, 4.8];
      hills.forEach((height, i) => {
        slabs(built, {
          count: 2,
          w: 2.6,
          h: height / 2,
          d: 2.0,
          x: -7.4 + i * 2.9,
          y: -5.4 + height / 2,
          dy: -(height / 2) * 0.95,
          colour: shade(base, i * 0.12),
          amp: 0.05,
        });
      });
      break;
    }

    case 'comparison': {
      slabs(built, { count: 5, w: 5.8, h: 0.95, d: 2.6, x: 0.3, y: 6.6, dy: -1.05, shrink: 0.02, colour: base, accent, tilt: 0.03 });
      slabs(built, { count: 5, w: 5.8, h: 0.95, d: 2.6, x: -0.3, y: -6.6, dy: 1.05, shrink: 0.02, colour: accent, tilt: -0.03 });
      break;
    }

    case 'crew': {
      const heights = [4.2, 5.4, 6.2, 5.0, 3.8];
      heights.forEach((height, i) => {
        slabs(built, {
          count: 5,
          w: 1.7,
          h: height / 5,
          d: 1.5,
          x: -6.6 + i * 3.2,
          y: -5.8 + height / 2,
          dy: -(height / 5) * 0.92,
          shrink: 0.1,
          colour: shade(base, i * 0.1, accent),
        });
      });
      break;
    }

    case 'close':
    default: {
      /*
       * The ring alone. A white share stub used to sit across it, and as the body turned the stub
       * swept through the closing sentence at 2.3:1. The card you send belongs to the ending, which
       * is phase 4's job - not a white slab behind the last words.
       */
      stairRing(built, { x: 0, y: 6.6, z: -1.4, radius: 4.2, count: 18, w: 1.1, h: 0.55, d: 0.55, colour: base, accent, tilt: 0 });
      stairRing(built, { x: 0, y: 6.6, z: -3.2, radius: 3.0, count: 14, w: 0.9, h: 0.48, d: 0.48, colour: accent, tilt: 0.12 });
      break;
    }
  }

  return built;
}

/** A stable pair of signs per chapter, so the crop leans a different way on each page. */
function pieceAxis(id: string): [number, number] {
  let hash = 7;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return [hash % 2 === 0 ? 1 : -1, (hash >> 1) % 2 === 0 ? 1 : -1];
}

export function WrappedMasses({ chapter, still }: { chapter: Chapter; still?: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stillRef = useRef(Boolean(still));

  useEffect(() => {
    stillRef.current = Boolean(still);
  }, [still]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    /*
     * **The canvas belongs to this effect, not to React.**
     *
     * A dev double-mount disposes the first renderer and mounts a second one; sharing one canvas
     * between the two left the second renderer holding a context that had already been lost, and a
     * lost context is an opaque empty rectangle - which painted the whole colour field white.
     */
    const canvas = document.createElement('canvas');
    canvas.className = 'w-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      /*
       * `preserveDrawingBuffer` is on so the check can read this canvas itself. Two canvas frames a
       * second apart are how the deck proves the object moves; a screenshot of the page could not
       * tell the object from the grain drifting over it.
       */
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      /* No WebGL is a flat picture rather than a broken page: the stylesheet paints a fallback. */
      host.setAttribute('data-fallback', '1');
      canvas.remove();
      return undefined;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    const [, accent] = lookFor(chapter.id).mass;

    /* Sky above, the chapter's own colour underneath: the underside of a step is never grey. */
    scene.add(new THREE.HemisphereLight(0xffffff, accent, 1.05));

    const key = new THREE.DirectionalLight(0xffffff, 3.6);
    key.position.set(8, 11, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 70;
    key.shadow.camera.left = -16;
    key.shadow.camera.right = 16;
    key.shadow.camera.top = 16;
    key.shadow.camera.bottom = -16;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffffff, 2.8);
    rim.position.set(-10, -6, 7);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(new THREE.Color(accent), 1.4);
    fill.position.set(-3, 9, -9);
    scene.add(fill);

    const built = build(chapter);
    scene.add(built.group);
    /* How many steps the body is made of. The crop is measured from the picture itself, by the check. */
    host.dataset.steps = String(built.steps);

    const film = host.closest('.film2') as HTMLElement | null;
    let nominal = 1;

    /*
     * **Where the object actually lands on the page.**
     *
     * Eight corners of the group's world box, projected through the live camera, then mapped into
     * the page with the canvas's own rectangle. Reading the rectangle (not `clientWidth`) means a
     * CSS shrink on the host moves these numbers too, which is what makes the crop check honest.
     */
    const measure = () => {
      built.group.updateMatrixWorld(true);
      const canvasRect = canvas.getBoundingClientRect();
      const frame = film?.getBoundingClientRect() ?? canvasRect;
      const point = new THREE.Vector3();
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      /*
       * **The vertices, not the box around them.**
       *
       * An axis-aligned box around a diagonal staircase is mostly empty air, so fitting to its
       * corners made every body too small: the cover's box measured 1714px while the object on
       * screen was 1372px. Every mesh's own vertices are projected instead, so the number is the
       * silhouette the eye sees.
       */
      built.group.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const position = mesh.geometry?.getAttribute('position');
        if (!position) return;
        for (let i = 0; i < position.count; i += 1) {
          point.fromBufferAttribute(position as THREE.BufferAttribute, i).applyMatrix4(mesh.matrixWorld).project(camera);
          const x = canvasRect.left + (point.x * 0.5 + 0.5) * canvasRect.width - frame.left;
          const y = canvasRect.top + (-point.y * 0.5 + 0.5) * canvasRect.height - frame.top;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      });

      return { left, top, right, bottom, w: right - left, h: bottom - top, frame };
    };

    const fit = () => {
      camera.updateProjectionMatrix();
      const frame = (film?.getBoundingClientRect() ?? canvas.getBoundingClientRect());
      const target = 1.2 * Math.max(frame.width, frame.height);

      /*
       * **Scaling is not linear on screen, so the fit is solved, not assumed.**
       *
       * A group's depth scales with its size, so a shrink pushes the far faces further away and the
       * projection lands short of the target - the cover came out at 1378px when 1728 was asked for.
       * Three passes converge in practice, and the cost is two box projections.
       */
      /*
       * **Each body is centred on itself before it is sized.**
       *
       * Scaling happens about the origin, so a body authored high in the frame (the closing ring sits
       * at y 6.6) flew upwards as it grew and left only a sliver in shot. Taking the body's own centre
       * and holding it at the middle means the growth is symmetrical, and the nudge afterwards is the
       * only thing that decides which two edges get cut.
       */
      const local = new THREE.Box3().setFromObject(built.group);
      const centre = local.getCenter(new THREE.Vector3());
      const place = (scale: number) => {
        built.group.scale.setScalar(scale);
        built.group.position.set(-centre.x * scale, -centre.y * scale, -centre.z * scale);
      };

      let factor = 1;
      for (let pass = 0; pass < 3; pass += 1) {
        place(factor);
        const at = measure();
        factor = THREE.MathUtils.clamp((factor * target) / Math.max(1, at.w, at.h), 0.3, 12);
      }
      place(factor);
      nominal = factor;

      /* Then off-centre, so the two cut edges are not a symmetrical crop. */
      const [signX, signY] = pieceAxis(chapter.id);
      const settled = measure();
      const pxPerUnit = settled.w / Math.max(0.001, (local.max.x - local.min.x) * factor);
      /*
       * **A wide body gets a smaller shove.**
       *
       * The fit leaves a tenth of the frame hanging past each side, and six per cent of the frame is
       * more than half of that: on the ranked chapter's bar chart the nudge and the entrance's own
       * turn together pulled the right edge back inside the frame, so the crop came and went from one
       * run to the next. The shove is measured against the body's own shape now - wide bodies keep
       * their overshoot, tall ones keep the full off-centre crop.
       */
      const wide = settled.w / Math.max(1, settled.h) > 2.4;
      built.group.position.x += (signX * (wide ? 0.02 : 0.06) * frame.width) / pxPerUnit;

      /*
       * **The flat patch is where the words are not.**
       *
       * A body centred on the frame puts its lit face exactly behind the sentence, which is how the
       * eras chapter fell to 2.5:1. The chapter already says where its copy sits, so the object steps
       * away from that side along whichever axis it is not being cropped on: the crop keeps its two
       * edges, and the words keep a calm field to land on.
       */
      const copyPlace = (film as HTMLElement | null)?.dataset.place ?? 'center';
      const crossesX = settled.w > frame.width + 1;
      const crossesY = settled.h > frame.height + 1;
      if (copyPlace === 'top' && crossesX) {
        built.group.position.y -= (0.13 * frame.height) / pxPerUnit;
      } else if (copyPlace === 'bottom' && crossesX) {
        built.group.position.y += (0.13 * frame.height) / pxPerUnit;
      } else if (copyPlace === 'center' && crossesY) {
        built.group.position.x += (signX * 0.08 * frame.width) / pxPerUnit;
      } else {
        built.group.position.y += (signY * 0.03 * frame.height) / pxPerUnit;
      }

    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      /* A portrait frame has a much narrower horizontal field, so the lens opens to keep the mass wide. */
      camera.fov = camera.aspect < 0.85 ? 54 : 40;
      camera.updateProjectionMatrix();
      fit();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const seed = pieceAxis(chapter.id)[0] * 0.5 + 0.5;
    const drift = 0.05 + seed * 0.05;
    const started = performance.now();
    let frame = 0;

    const draw = (now: number, animate: boolean) => {
      /*
       * **A still frame is actually still.**
       *
       * The drift and the camera used to run whether or not the deck was in its reduced-motion mode,
       * so only the small bobs stopped and the page kept turning. When there is no motion to give, the
       * clock is pinned and every transform stays where it was at zero: one frame, no drift.
       */
      const t = animate ? now / 1000 : 0;
      const enter = animate ? Math.min(1, (now - started) / 900) : 1;
      const ease = 1 - (1 - enter) ** 3;

      built.group.rotation.y = Math.sin(t * 0.13 + seed * 2) * 0.2 + (animate ? (1 - ease) * -0.16 : 0);
      built.group.rotation.z = Math.sin(t * 0.1 + seed) * 0.035;
      built.group.scale.setScalar(nominal * (1 + (1 - ease) * 0.16));
      camera.position.x = Math.sin(t * (0.07 + drift) + seed * 3) * 0.5;
      camera.position.y = Math.cos(t * 0.06) * 0.22;
      camera.lookAt(0, 0, 0);

      if (animate) {
        for (const piece of built.pieces) {
          piece.mesh.position.y = piece.y + Math.sin(t * 0.55 + piece.phase) * piece.amp;
          piece.mesh.rotation.z = piece.rotZ + Math.sin(t * 0.42 + piece.phase) * piece.spin;
        }
      }

      renderer.render(scene, camera);
    };

    if (stillRef.current) {
      draw(performance.now(), false);
    } else {
      const tick = (now: number) => {
        if (!document.hidden) draw(now, !stillRef.current);
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const material = node.material;
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
          else material.dispose();
        }
      });
      built.pieces.length = 0;
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [chapter.id]);

  return <div className="w-mass" ref={hostRef} aria-hidden="true" />;
}

/* Exported for the check that reads a chapter's palette without a browser. */
