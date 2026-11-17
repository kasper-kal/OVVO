import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Chapter } from '../../lib/wrappedDeck';
import { lookFor } from '../../lib/wrappedLook';

/*
 * **The mass is a lit object now, not a silhouette.**
 *
 * The colour field and the sentence are still DOM: the field is painted by the stage, and the words
 * are set on top of it in `WrappedScenes`. What sits between them is real geometry - ribbon solids,
 * stacked slabs, rings and discs - lit by a key, a rim and a fill, with a shadow map so the folds
 * and the steps occlude one another. That is the difference between a shape with a gradient painted
 * on it and a surface that turns.
 *
 * One canvas per chapter, transparent, so the field shows through and the type is never covered.
 * The canvas is deliberately wider and taller than the frame and is clipped by `.film2-art`, which
 * is what makes every form read as cut off by the edge rather than fitted inside it.
 *
 * Nothing here holds a word or a number. The camera is the only thing that moves the picture, and
 * the pieces breathe on their own slow clocks.
 */

type Piece = {
  mesh: THREE.Object3D;
  y: number;
  phase: number;
  amp: number;
  spin: number;
  rotZ: number;
};

type Built = { group: THREE.Group; pieces: Piece[] };

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

function disc(radius: number, thickness: number, colour: string, metalness = 0.5, roughness = 0.28): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, thickness, 64),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), metalness, roughness }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function ring(radius: number, tube: number, colour: string, metalness = 0.2, roughness = 0.34): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 24, 96),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), metalness, roughness }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function capsule(radius: number, length: number, colour: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, 12, 28),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), metalness: 0.1, roughness: 0.46 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sphere(radius: number, colour: string, emissive = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(colour),
      emissive: new THREE.Color(colour),
      emissiveIntensity: emissive,
      metalness: 0.05,
      roughness: 0.55,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/*
 * **A ribbon is a solid, not a strip.**
 *
 * Four corners per step - across the width and through the thickness - swept along a curve and
 * twisted as they go. The surface therefore has real faces that catch the key light on one edge and
 * fall to the rim on the other, and the fold at the twist is genuine geometry rather than a painted
 * gradient. This is the shape the cover, the distance and the long haul are built from.
 */
function ribbon(
  points: [number, number, number][],
  width: number,
  thickness: number,
  twist: number,
  colour: string,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
    0.4,
  );
  const steps = 150;
  const positions: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, up);
    if (side.lengthSq() < 1e-5) side.set(1, 0, 0);
    side.normalize();
    const face = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const angle = twist * Math.sin(t * Math.PI * 1.35);
    const wide = side.clone().multiplyScalar(Math.cos(angle)).addScaledVector(face, Math.sin(angle));
    const thick = side.clone().multiplyScalar(-Math.sin(angle)).addScaledVector(face, Math.cos(angle));
    const halfW = (width * (0.62 + 0.38 * Math.sin(t * Math.PI))) / 2;
    const halfT = thickness / 2;
    const corners = [
      point.clone().addScaledVector(wide, halfW).addScaledVector(thick, halfT),
      point.clone().addScaledVector(wide, -halfW).addScaledVector(thick, halfT),
      point.clone().addScaledVector(wide, -halfW).addScaledVector(thick, -halfT),
      point.clone().addScaledVector(wide, halfW).addScaledVector(thick, -halfT),
    ];
    corners.forEach((corner) => positions.push(corner.x, corner.y, corner.z));
  }

  for (let i = 0; i < steps; i += 1) {
    const a = i * 4;
    const b = (i + 1) * 4;
    for (let k = 0; k < 4; k += 1) {
      const next = (k + 1) % 4;
      indices.push(a + k, b + k, a + next, a + next, b + k, b + next);
    }
  }
  const last = steps * 4;
  indices.push(0, 1, 2, 0, 2, 3, last, last + 2, last + 1, last, last + 3, last + 2);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(colour),
      roughness: 0.33,
      metalness: 0.24,
      side: THREE.DoubleSide,
    }),
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
    amp: opts.amp ?? 0.12,
    spin: opts.spin ?? 0.05,
    rotZ: mesh.rotation.z,
  });
}

/* A stepped stack: the shape the year's tickets, the pair and the comparison are all made of. */
function stack(
  built: Built,
  count: number,
  width: number,
  height: number,
  depth: number,
  topY: number,
  colour: string,
  direction = -1,
): void {
  const step = height * 0.92;
  for (let i = 0; i < count; i += 1) {
    const tone = shade(colour, i / Math.max(1, count - 1) * 0.36);
    const mesh = box(width * (1 - i * 0.02), height, depth, tone);
    mesh.position.set(
      Math.sin(i * 1.7) * 0.32,
      topY + direction * i * step,
      Math.cos(i * 1.3) * 0.5,
    );
    mesh.rotation.y = Math.sin(i * 1.1) * 0.13;
    mesh.rotation.z = Math.sin(i * 0.9) * 0.03;
    add(built, mesh, { amp: 0.07, spin: 0.02, phase: i * 0.7 });
  }
}

function build(chapter: Chapter): Built {
  const built: Built = { group: new THREE.Group(), pieces: [] };
  const [base, accent] = lookFor(chapter.id).mass;

  switch (chapter.id) {
    case 'cover': {
      add(built, ribbon([[-13, 4.8, -2], [-4, 2.6, 3], [4, 5.2, -3], [13, 2.2, 2]], 5.4, 1.3, 1.05, base), { amp: 0.18, spin: 0.05 });
      add(built, ribbon([[-13, -5.4, 2], [-3, -2.8, -3], [5, -5.8, 2], [13, -3.2, -1]], 4.6, 1.0, -0.95, accent), { amp: 0.16, spin: 0.04, phase: 2 });
      break;
    }

    case 'total': {
      /* Six tickets, starting above the frame so the column is cut by the ceiling. */
      stack(built, 6, 7.2, 0.85, 2.4, 6.6, base, -1);
      break;
    }

    case 'name': {
      const badge = ring(3.6, 0.85, base, 0.35, 0.3);
      badge.position.set(4.2, 6.2, 0);
      badge.rotation.set(0.4, 0.3, -0.35);
      add(built, badge, { amp: 0.2, spin: 0.12 });
      const plate = box(5.6, 3.6, 0.7, accent);
      plate.position.set(-4.6, 5.6, 0.6);
      plate.rotation.set(0.14, -0.3, 0.22);
      add(built, plate, { amp: 0.14, spin: 0.07, phase: 1.4 });
      break;
    }

    case 'map': {
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          const height = 0.5 + ((row + col) % 3) * 0.55;
          const tile = box(2.1, height, 1.6, shade(base, ((row + col) % 3) * 0.16));
          tile.position.set(-6.4 + col * 2.5, -5.2 + height / 2, -1.6 + row * 1.1);
          add(built, tile, { amp: 0.03, spin: 0.01, phase: row + col });
        }
      }
      for (let i = 0; i < 7; i += 1) {
        const pin = sphere(0.24, accent, 0.9);
        pin.position.set(-6 + i * 2.1, -1.4 + Math.sin(i * 1.9) * 1.5, 0.8);
        add(built, pin, { amp: 0.16, spin: 0, phase: i * 0.9 });
      }
      break;
    }

    case 'distance': {
      add(built, ribbon([[-13, 3.6, 0], [-6, 4.8, 2], [0, 2.4, -2], [7, 4.4, 1], [13, 2.8, -1]], 6.2, 1.4, 1.3, base), { amp: 0.2, spin: 0.05 });
      add(built, ribbon([[-13, -6.6, 1], [-4, -5.4, -2], [6, -6.8, 1], [13, -5.6, -2]], 4.4, 1.0, -1.1, accent), { amp: 0.15, spin: 0.04, phase: 1.1 });
      break;
    }

    case 'pair': {
      stack(built, 4, 7.4, 0.9, 2.6, 6.4, base, -1);
      stack(built, 4, 7.4, 0.9, 2.6, -6.4, accent, 1);
      break;
    }

    case 'origin': {
      /* Turned well off square, so the top face and one side both catch the key light. */
      const slab = box(7, 7, 3.2, base);
      slab.position.set(1.2, 6.4, -0.5);
      slab.rotation.set(0.35, -0.6, -0.1);
      add(built, slab, { amp: 0.1, spin: 0.03 });
      const cap = box(7.4, 0.8, 3.6, accent);
      cap.position.set(1.2, 10.4, -0.5);
      cap.rotation.set(0.35, -0.6, -0.1);
      add(built, cap, { amp: 0.12, spin: 0.03, phase: 1 });
      const behind = box(4.6, 5.4, 2, shade(base, 0.3));
      behind.position.set(-5.4, 7.4, -3);
      behind.rotation.set(0.2, 0.5, 0.12);
      add(built, behind, { amp: 0.12, spin: 0.04, phase: 2 });
      break;
    }

    case 'hour': {
      for (let i = 0; i < 7; i += 1) {
        const tunnel = ring(4.2 - i * 0.4, 0.26, i % 2 === 0 ? base : accent, 0.3, 0.3);
        tunnel.position.set(0, 0.6, -6 + i * 1.5);
        tunnel.rotation.set(0, 0, i * 0.12);
        add(built, tunnel, { amp: 0.05, spin: 0.06, phase: i * 0.6 });
      }
      break;
    }

    case 'direct': {
      for (let i = 0; i < 6; i += 1) {
        const step = box(3.8, 1.0, 2.4, shade(base, i * 0.14));
        step.position.set(-6.6 + i * 2.7, -6.4 + i * 1.15, -1 + i * 0.6);
        step.rotation.set(0, -0.24, 0);
        add(built, step, { amp: 0.07, spin: 0.02, phase: i });
      }
      break;
    }

    case 'longest': {
      const road = ribbon([[-13, -3.2, -1], [-5, -4.2, 1], [3, -3.4, -1], [13, -4.4, 1]], 7, 0.9, 0.35, base);
      add(built, road, { amp: 0.09, spin: 0.02 });
      const horizon = box(26, 0.16, 0.5, accent);
      horizon.position.set(0, -1.2, -2);
      add(built, horizon, { amp: 0.01, spin: 0 });
      break;
    }

    case 'look': {
      const wing = ribbon([[-13, 6, -4], [-6, 4.4, -1], [0, 6.4, -4], [8, 4.8, -1]], 4.2, 0.8, 0.8, accent);
      add(built, wing, { amp: 0.14, spin: 0.04 });
      break;
    }

    case 'eras': {
      for (let i = 0; i < 3; i += 1) {
        const slab = box(4.2, 8, 1.1, shade(base, i * 0.18));
        slab.position.set(-4.6 + i * 4.4, 6.6, -2 + i * 1.6);
        slab.rotation.set(0, 0.2 - i * 0.18, 0.05 - i * 0.03);
        add(built, slab, { amp: 0.1, spin: 0.03, phase: i });
      }
      break;
    }

    case 'lines': {
      const heights = [6.2, 4.6, 7.2, 4.0, 5.6, 7.8, 4.2, 5.2, 6.6];
      heights.forEach((height, i) => {
        const column = box(1.3, height, 1.5, i % 2 === 0 ? base : shade(base, 0.3));
        column.position.set(-6.4 + i * 1.6, 7.6 - height / 2, -1 + (i % 3) * 0.8);
        add(built, column, { amp: 0.05, spin: 0.02, phase: i * 0.5 });
      });
      break;
    }

    case 'awards': {
      const discs = [
        { x: -4.2, y: -4.4, r: 3.1, z: 1.2 },
        { x: 1.6, y: -5.4, r: 2.6, z: -0.6 },
        { x: 5.6, y: -4.8, r: 3.3, z: 1.8 },
      ];
      discs.forEach((d, i) => {
        const medal = disc(d.r, 0.62, i === 1 ? accent : base, 0.72, 0.22);
        medal.position.set(d.x, d.y, d.z);
        medal.rotation.set(1.28, 0.2 * i, 0.24 - i * 0.18);
        add(built, medal, { amp: 0.14, spin: 0.05, phase: i });
      });
      break;
    }

    case 'bookends': {
      const sun = sphere(2.2, accent, 0.5);
      sun.position.set(-4.6, -1.4, -3);
      add(built, sun, { amp: 0.14, spin: 0 });
      const heights = [2.4, 3.4, 2.8, 4.2, 3.2, 4.6];
      heights.forEach((height, i) => {
        const step = box(2.9, height, 2, shade(base, i * 0.12));
        step.position.set(-7.4 + i * 2.9, -5.4 + height / 2, -1 + (i % 2) * 1.2);
        add(built, step, { amp: 0.05, spin: 0.02, phase: i });
      });
      break;
    }

    case 'comparison': {
      stack(built, 4, 6.8, 0.9, 2.4, 6.4, base, -1);
      stack(built, 4, 6.8, 0.9, 2.4, -6.4, accent, 1);
      break;
    }

    case 'crew': {
      const heights = [4.4, 5.6, 6.4, 5.2, 4.0];
      heights.forEach((height, i) => {
        const person = capsule(0.72, height, shade(base, i * 0.1, accent));
        person.position.set(-6.4 + i * 3.2, -5.6 + height / 2, -1.4 + (i % 3) * 1.2);
        add(built, person, { amp: 0.1, spin: 0.03, phase: i });
      });
      break;
    }

    case 'close':
    default: {
      const halo = ring(4.4, 0.6, base, 0.4, 0.28);
      halo.position.set(0, 6.8, -1.4);
      halo.rotation.set(0.1, 0.1, 0);
      add(built, halo, { amp: 0.16, spin: 0.06 });
      const stub = box(4.2, 2.8, 0.36, '#ffffff', 0.05, 0.5);
      stub.position.set(0.8, 5.6, 1.6);
      stub.rotation.set(0.1, -0.2, -0.16);
      add(built, stub, { amp: 0.12, spin: 0.04, phase: 1 });
      break;
    }
  }

  return built;
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
     * lost context is an opaque empty rectangle - which painted the whole colour field white. A
     * canvas created here is thrown away with the effect that made it.
     */
    const canvas = document.createElement('canvas');
    canvas.className = 'w-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 140);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    const [, accent] = lookFor(chapter.id).mass;

    /* Sky above, the chapter's own colour underneath: the underside of a fold is never grey. */
    scene.add(new THREE.HemisphereLight(0xffffff, accent, 1.15));

    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(7, 10, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.bias = -0.0016;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffffff, 2.6);
    rim.position.set(-9, -5, 7);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(new THREE.Color(accent), 1.5);
    fill.position.set(-2, 8, -8);
    scene.add(fill);

    const built = build(chapter);
    scene.add(built.group);

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
      /* And the object grows with the narrowness, so it is still cut off on a phone. */
      built.group.scale.setScalar(Math.max(1, Math.min(1.9, 0.92 / camera.aspect)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    let last = performance.now();

    const draw = (now: number, animate: boolean) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      if (animate) {
        built.group.rotation.y = Math.sin(t * 0.16) * 0.15;
        built.group.rotation.z = Math.sin(t * 0.11) * 0.035;
        camera.position.x = Math.sin(t * 0.085) * 0.45;
        camera.position.y = Math.cos(t * 0.07) * 0.2;
        camera.lookAt(0, 0, 0);

        for (const piece of built.pieces) {
          piece.mesh.position.y = piece.y + Math.sin(t * 0.62 + piece.phase) * piece.amp;
          piece.mesh.rotation.z = piece.rotZ + Math.sin(t * 0.46 + piece.phase) * piece.spin;
        }
        /* Nothing reads the delta yet; it is here so the clocks stay honest if a piece gains easing. */
        void dt;
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
export const massTint = (chapter: Chapter) => lookFor(chapter.id).mass[0];
