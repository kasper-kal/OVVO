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
  rotX: number;
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
    rotX: mesh.rotation.x,
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

/*
 * **The one-chapter lab: one satin body, filmed close up.**
 *
 * The reference does not build a card out of a pattern. It puts a single body in front of the camera and
 * lets the frame cut it, so the shape is a thing in a room rather than a wallpaper. This is that body for
 * the counting card: a pleated sheet, authored four times wider and taller than the frame, so every edge
 * of the picture cuts it and there is no silhouette to see.
 *
 * Its folds are **contiguous**. Each band shares its crease with the band beside it, to the vertex, so the
 * body has no air anywhere inside the frame - which is the one thing the old nine-blade fan could never
 * stop doing: nine slabs with black between them read as nine small objects, not one big one.
 *
 * The sheen is baked into the vertices, because the body is the picture: each fold runs dark at its crease
 * and bright on its belly, so the light rolls across the fabric instead of stepping down a facet. The roll
 * also fades towards the middle of the frame, which is where the sentence stands - so the words are legible
 * because the fabric is in shadow there, and not because a plate was laid over it.
 */
function satin(
  built: Built,
  o: { folds: number; colour: string; accent: string; dark: string },
): void {
  /*
   * **One pleated sheet, filmed close up.**
   *
   * Two earlier bodies failed in opposite directions. Nine separate blades with air between them made the
   * eye count nine small objects. A frame of soft blobs made it count nothing at all. This is the middle:
   * a single sheet, authored four times wider and taller than the frame, so every edge of the picture cuts
   * it and there is no outline anywhere to see. Its folds are **contiguous**: each band shares its ridge
   * with the band beside it, to the vertex, so there is no air inside the frame at all.
   *
   * The sheen is baked into the vertices, because the body is the picture: each fold runs dark at its
   * crease and bright across its belly, so light rolls over cloth instead of stepping down a facet. The
   * roll also lets go towards the middle of the frame, which is where the sentence stands, so the words
   * are legible because the fabric is in shadow there and not because something was laid over it.
   */
  const FOLDS = o.folds;
  const UP = 26;
  /* The sheet is the whole frame, so a coarse grid shows: at twelve columns the light crossed a fold in
     visible steps and the picture read as faceted plastic. */
  const ROWS = 40;
  const COLS = 26;

  /* The folds gather towards one side, the way cloth does: no two are the same width. */
  const edges: number[] = [];
  let cursor = -27;
  for (let k = 0; k <= FOLDS; k += 1) {
    edges.push(cursor);
    cursor += (54 / FOLDS) * (1 - 0.34 * (k / FOLDS));
  }

  const lit = new THREE.Color(o.accent);
  const mid = new THREE.Color(o.colour);
  const deep = new THREE.Color(o.dark);
  const hot = new THREE.Color('#f4ffe0');

  /* The fabric is not flat: it bows towards the camera, and the creases swing as they climb. */
  const bowZ = (x: number) => Math.cos(x * 0.055) * 5.2;
  const backZ = (k: number) => -2.6 - 0.9 * Math.cos(k * 0.9);
  const creaseY = (x: number, v: number) => Math.sin(x * 0.11 + 0.4) * 4.2 + Math.sin(v * 2.4 + x * 0.05) * 1.7;
  /* The sheet is hung on a slant, so the folds run across the frame instead of fencing it. */
  const skew = 0.2;

  /*
   * **Matte, because satin is soft.** At a quarter roughness the scene's own key light laid thin white
   * streaks down every fold, and a wet white line on a coloured fold is a plastic rod, not cloth. The
   * sheen is baked into the vertices instead, where it can be as broad as the reference's is.
   */
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.68,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  for (let k = 0; k < FOLDS; k += 1) {
    const xa = edges[k];
    const xb = edges[k + 1];
    const za = bowZ(xa) + backZ(k);
    const zb = bowZ(xb) + backZ(k + 1);
    const depth = 2.6 + 0.7 * Math.sin(k * 1.7 + 0.6);

    /*
     * **Two faces per fold, not one skin.**
     *
     * A tent drawn as one mesh has its ridge averaged by the normals, and an averaged ridge is a rounded
     * pipe. Each half of the fold is its own panel here, touching its twin along the ridge to the vertex:
     * the surface never opens, and the normals stop dead at the ridge, so the crease is a real edge with
     * light on one side of it and shadow on the other.
     */
    for (let face = 0; face < 2; face += 1) {
      const from = face === 0 ? 0 : 0.5;
      const positions: number[] = [];
      const colours: number[] = [];
      const index: number[] = [];
      const tint = new THREE.Color();

      for (let r = 0; r <= ROWS; r += 1) {
        const v = r / ROWS;
        for (let c = 0; c <= COLS; c += 1) {
          const u = from + (0.5 * c) / COLS;
          const flat = xa + (xb - xa) * u;
          /* A curved face, so the light rolls over it; the hard part is the ridge, not the face. */
          const puff = Math.sin(Math.PI * u) ** 0.72;
          const y = -UP + 2 * UP * v + creaseY(flat, v);
          /*
           * **The big fold.** The sheet is pushed back along its middle, so two wide planes lean away
           * from the camera and meet in a crease that runs across the frame. That crease is the only line
           * the picture needs: an edge inside one body, not the outline of a small one, and it is the
           * shadow the sentence is written in.
           */
          const lean = Math.max(0, Math.abs(y) - 5) * 0.62;
          const z = za + (zb - za) * u + puff * depth + lean;
          positions.push(flat + y * skew, y, z);

          /*
           * **Light is a place on the cloth, not a line on every rib.**
           *
           * A hot ridge on each fold made the card a bundle of green pipes: a bright rim repeated at one
           * width is a cylinder, whichever way it is drawn. The light is read across the whole sheet, in
           * one slow sweep that brightens towards the top right, so the picture has a lit side and a dark
           * side instead of an even ribbing.
           */
          const across = 0.34 + 0.66 * (0.5 + 0.5 * Math.sin(flat * 0.028 + y * 0.03 + 2.4));
          const nearCrease = 0.22 + 0.78 * Math.min(1, Math.abs(y) / 8.5);
          const light = across ** 1.6 * nearCrease * (0.45 + 0.55 * puff);
          tint.copy(deep).lerp(mid, Math.min(1, light * 2.1));
          tint.lerp(lit, Math.min(0.75, Math.max(0, light - 0.42) * 1.7));
          /* Capped: a fold that reaches pure white stops being coloured cloth and becomes a lamp. */
          tint.lerp(hot, Math.min(0.34, Math.max(0, light - 0.84) * 3.2));
          colours.push(tint.r, tint.g, tint.b);
        }
      }

      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          const a = r * (COLS + 1) + c;
          const b = a + 1;
          const below = a + (COLS + 1);
          const beside = below + 1;
          index.push(a, below, b, b, below, beside);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
      geometry.setIndex(index);
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry, material);
      /*
       * Every band rides the same wave at the same phase. Giving each its own phase would pull the shared
       * ridge apart and open the air back up, which is the whole thing this body exists to avoid.
       */
      add(built, mesh, { amp: 0.05, spin: 0, phase: 0 });
      built.steps += 1;
    }
  }
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
      /* One satin sheet, pleated by the crease and never by the gap. */
      satin(built, { folds: 5, colour: base, accent, dark: shade(base, 0.78) });
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
      /*
       * A skyline of departure points, not a totem.
       *
       * The old body was a stack as tall as the frame was tall, so it sat behind the sentence
       * wherever the sentence went, and the dark ink was reading against its own shadowed side
       * (6.2:1). A wide, shallow run along the top keeps the crop - it runs off both sides - and
       * leaves the lower half of the card as the colour field the words are written on.
       */
      const heights = [1.2, 1.9, 1.5, 2.4, 1.7, 2.1, 1.3, 2.6, 1.6];
      heights.forEach((height, i) => {
        slabs(built, {
          count: 3,
          w: 1.7,
          h: height / 3,
          d: 1.6,
          x: -9.2 + i * 2.4,
          y: -1.6 + height / 2,
          dy: -(height / 3) * 0.94,
          shrink: 0.03,
          colour: i % 2 === 0 ? base : accent,
          amp: 0.05,
        });
      });
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
      /* A thin band of the frame: the run carries the wave hard, or the card is a still with a line on it. */
      slabs(built, { count: 7, w: 4.0, h: 1.15, d: 2.6, x: -7.2, y: -6.6, dx: 2.3, dy: 1.1, shrink: 0.02, yaw: -0.1, colour: base, accent, amp: 0.26 });
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

export function WrappedMasses({
  chapter,
  still,
  hold,
}: {
  chapter: Chapter;
  still?: boolean;
  /** Paused: the loop stops drawing and the time it lost is added back on resume. */
  hold?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stillRef = useRef(Boolean(still));
  const holdRef = useRef(Boolean(hold));

  useEffect(() => {
    stillRef.current = Boolean(still);
  }, [still]);

  useEffect(() => {
    holdRef.current = Boolean(hold);
  }, [hold]);

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
     * **A wide body turns less.**
     *
     * The first pass at real motion turned every body by the same angle. On the ranked bar chart and
     * the hour's beams, seven times wider than they are tall, turning by a quarter of a radian
     * narrows the silhouette by about a tenth, which pulled both cut edges back inside the frame and
     * failed the crop. Wide bodies keep their edges and spend the motion on the push instead.
     */
    let swayScale = 1;
    /*
     * Where `fit()` finally put the body. The motion adds to this; it must never write over it.
     *
     * The first pass set `group.position.x` and `.z` outright from the clock, which threw away the
     * centred position and the off-centre shove `fit()` had just solved, the body jumped off its
     * measured crop, the hour and ranked chapters came back inside the frame, and three cards' words
     * ended up under it. The fitted position is kept and the motion is an offset from it.
     */
    const fitted = new THREE.Vector3();

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
      const local = new THREE.Box3().setFromObject(built.group);
      /*
       * **A wide body is pushed further past the edges.**
       *
       * The fit leaves a tenth of the frame past each side, and three things spend it: the
       * off-centre shove, the camera's own pan, and the turn the body makes. On the ranked
       * chapter's bar chart, which is seven times wider than it is tall, those three together once
       * ate the whole overhang and the crop appeared and vanished between runs. A body much wider
       * than it is tall is fitted to a third past the frame instead, which is still a crop and no
       * longer a coin toss.
       */
      const wideBody = local.max.x - local.min.x > 2.4 * (local.max.y - local.min.y);
      swayScale = wideBody ? 0.35 : 1;
      /*
       * **The overhang is what the motion spends.**
       *
       * With the camera panning and the beat lurching, the body leaves its fitted pose for the whole
       * card; when it only overhung by a fifth, the hour and ranked chapters came back inside the
       * frame for part of their turn and the crop check failed them. The overshoot is raised so the
       * two cut edges survive the movement rather than only the still.
       */
      /* The ranking's bar chart is the widest body in the deck and the least forgiving of a shove. */
      /* Every body overhangs a little more: the sway and the beat spend part of the overhang now. */
      const overshoot = chapter.id === 'ranked' ? 1.55 : chapter.id === 'total' ? 1.36 : wideBody ? 1.36 : 1.26;
      const target = overshoot * Math.max(frame.width, frame.height);

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
      const centre = local.getCenter(new THREE.Vector3());
      const place = (scale: number) => {
        built.group.scale.setScalar(scale);
        built.group.position.set(-centre.x * scale, -centre.y * scale, -centre.z * scale);
      };

      let factor = 1;
      /*
       * Six passes, not three. "Three passes converge in practice" was true for the tall bodies it was
       * written on; the direct chapter's thin diagonal and the ranking's shallow chart landed about a
       * fifth short of the target, which is precisely the edge that went missing from their crop.
       */
      for (let pass = 0; pass < 6; pass += 1) {
        place(factor);
        const at = measure();
        factor = THREE.MathUtils.clamp((factor * target) / Math.max(1, at.w, at.h), 0.3, 12);
      }
      /*
       * The ranking's chart is the one body the projection solve cannot reach its target with: six
       * passes leave it about a third short, so its right edge sat inside the frame however wide the
       * target was set. It is scaled the rest of the way here, on the one chapter that needs it.
       */
      const finalScale = chapter.id === 'ranked' ? factor * 1.3 : chapter.id === 'crew' ? factor * 1.16 : factor;
      place(finalScale);
      nominal = finalScale;

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
      /*
       * The closing card is dodged whether or not its body crosses the frame sideways. Its ring is
       * taller than the frame rather than wider, so the sideways test never fired and the drag from
       * the ring sat behind the largest sentence in the deck, 6.4:1 where the rule asks for 7.
       */
      if (chapter.id === 'total') {
        /*
         * The lab card's body is the frame. It is not dodged away from the words any more, because the
         * words have moved onto the middle of the body: the fold is in shadow there and the sentence is
         * written on the fabric itself.
         */
      } else if (chapter.id === 'close') {
        /* The closing ring grew a small line above its headline and needs its body further off it. */
        built.group.position.y += (0.3 * frame.height) / pxPerUnit;
      } else if (copyPlace === 'top' && crossesX) {
        built.group.position.y -= (0.13 * frame.height) / pxPerUnit;
      } else if (copyPlace === 'bottom' && crossesX) {
        built.group.position.y += (0.13 * frame.height) / pxPerUnit;
      } else if (copyPlace === 'center' && crossesY) {
        built.group.position.x += (signX * 0.08 * frame.width) / pxPerUnit;
      } else {
        built.group.position.y += (signY * 0.03 * frame.height) / pxPerUnit;
      }

      fitted.copy(built.group.position);
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
    /*
     * `?stillmotion=1` pins the clock at zero. It is the break the deck check uses to prove that the
     * motion below is real: with the flag on, two canvas frames a tenth of a second apart are equal.
     */
    const frozen = new URLSearchParams(window.location.search).has('stillmotion');
    const started = performance.now();
    let frame = 0;

    /*
     * **The card is a loop, not a photograph.**
     *
     * Measured against the reference, our cards moved at about half its rate and every one of them
     * sat on one arrangement for fifteen seconds: three slow sine waves on a forty-eight second
     * period, which is a still picture with a wobble. The reference changes the whole frame every
     * tenth of a second, so this draws on three clocks at once: a **sway** that turns the body while
     * it is on screen, a **push** that brings it a fifth closer across the card, and a **beat** every
     * couple of seconds that lurches it towards the camera with the key light coming with it. The
     * slabs ride a wave that travels along the stack rather than bobbing in place, so the steps catch
     * the light one after another.
     */
    const CARD_SECONDS = 10;
    const BEAT_SECONDS = 2.4;
    /*
     * The lab card's body is the whole picture, so its motion is the picture's motion: it travels across
     * the frame and rolls, instead of turning on the spot the way a smaller body has to. A turn of the
     * whole sheet would swing it edge-on and empty the frame within a second.
     */
    const lab = chapter.id === 'total';

    const draw = (now: number, animate: boolean) => {
      /*
       * **A still frame is actually still.**
       *
       * The drift and the camera used to run whether or not the deck was in its reduced-motion mode,
       * so only the small bobs stopped and the page kept turning. When there is no motion to give, the
       * clock is pinned and every transform stays where it was at zero: one frame, no drift.
       */
      const clock = animate && !frozen ? now / 1000 : 0;
      const enter = animate ? Math.min(1, (now - started) / 900) : 1;
      const ease = 1 - (1 - enter) ** 3;
      /* How far through this card we are, 0 to 1, so the push restarts with every chapter. */
      const through = (clock % CARD_SECONDS) / CARD_SECONDS;
      /* The beat: a sharp hit that decays over half a second. */
      const beat = Math.max(0, 1 - (clock % BEAT_SECONDS) / 0.5) ** 2;

      built.group.rotation.y =
        Math.sin(clock * (0.85 + drift) + seed * 2) * (lab ? 0.1 : 0.3) * swayScale + (animate ? (1 - ease) * -0.16 : 0);
      /* The whole body travels as well as turns: a distant one turns by millimetres on screen. */
      built.group.position.x = fitted.x + Math.sin(clock * 0.7 + seed * 1.7) * (lab ? 1.0 : 0.28);
      built.group.position.y = fitted.y + (lab ? Math.sin(clock * 0.37 + seed) * 0.55 : 0);
      built.group.rotation.z = Math.sin(clock * 0.27 + seed) * (lab ? 0.07 : 0.05);
      built.group.rotation.x = Math.sin(clock * 0.19 + seed * 2) * 0.04;
      built.group.scale.setScalar(nominal * (1 + 0.09 * through + (1 - ease) * 0.16));
      /* The lurch. A tenth of a second on the beat is a step of several pixels, which is what makes
         a film read as alive at a glance rather than as a picture that breathes. */
      built.group.position.z = fitted.z + beat * (lab ? 0.3 : 0.75);

      camera.position.x = Math.sin(clock * 0.85 + seed * 3) * 1.1;
      camera.position.y = 0.45 - through * 0.9 + Math.cos(clock * 0.6) * 0.5;
      camera.position.z = 14 - 1.4 * through;
      camera.lookAt(0, 0, 0);
      key.intensity = 3.6 + beat * 1.5;

      if (animate) {
        for (const piece of built.pieces) {
          /* A wave that runs along the stack, not every slab humming on its own. */
          const wave = Math.sin(clock * 1.5 - piece.phase * 1.1);
          /* Wide bodies turn little, so their slabs carry the wave further to make up for it. */
          const reach = 3.2 / Math.max(0.35, swayScale);
          piece.mesh.position.y = piece.y + (wave * reach + Math.sin(clock * 0.7 + piece.phase) * 0.5) * piece.amp;
          piece.mesh.rotation.z = piece.rotZ + Math.sin(clock * 1.05 - piece.phase) * piece.spin * 2.6;
          piece.mesh.rotation.x = piece.rotX + Math.sin(clock * 0.9 + piece.phase * 1.6) * piece.spin * 1.6;
        }
      }

      renderer.render(scene, camera);
    };

    /*
     * **A held card keeps the frame it was showing.**
     *
     * Pause cannot simply stop the clock: the old still mode drew one frame at t = 0, which would
     * have snapped a half-turned body back to its entrance pose the moment it was paused. The loop
     * stops drawing instead, the canvas keeps its last pixels, and the time spent paused is added
     * back to the clock so the object carries on from where it stopped rather than jumping forward.
     */
    let heldMs = 0;
    let holdStart = 0;
    const tick = (now: number) => {
      if (holdRef.current) {
        if (!holdStart) holdStart = now;
      } else {
        if (holdStart) {
          heldMs += now - holdStart;
          holdStart = 0;
        }
        if (!document.hidden) draw(now - heldMs, !stillRef.current);
      }
      frame = window.requestAnimationFrame(tick);
    };

    /* The first frame is drawn now, so a paused card is a picture rather than an empty canvas. */
    draw(performance.now(), !stillRef.current);
    if (!stillRef.current) frame = window.requestAnimationFrame(tick);

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
