import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Chapter } from '../../lib/wrappedDeck';

/*
 * **One object for the whole year.**
 *
 * The old world swapped a different sculpture in for every chapter, which is how a year of
 * chapters still felt like slides. This is one ribbon. Every chapter gives the ribbon a new
 * path, width and colour, and the same mesh bends from the old path into the new one. The
 * camera, lights and black stage never remount.
 *
 * The paths are the data, not decoration beside it: the map is a loop through the places, the
 * hour is a 24-lobed clock, the comparison is two columns of different heights, the awards are
 * four loops, and the closing ring closes the year. Nothing here carries a label. The sentence
 * in `WrappedScenes` carries the words.
 */

const SEGMENTS = 300;
const TAU = Math.PI * 2;
const CAMERA_DIR = new THREE.Vector3(0, 0, 1);

type FilmPlace = 'top' | 'center' | 'bottom';

const PLACE: Record<string, FilmPlace> = {
  cover: 'center',
  total: 'bottom',
  name: 'center',
  map: 'bottom',
  distance: 'top',
  pair: 'center',
  origin: 'bottom',
  hour: 'top',
  direct: 'center',
  longest: 'top',
  look: 'bottom',
  eras: 'bottom',
  lines: 'center',
  awards: 'bottom',
  bookends: 'top',
  comparison: 'center',
  crew: 'bottom',
  close: 'center',
};

const TINT: Record<string, [string, string]> = {
  cover: ['#ff2d75', '#ff7a00'],
  total: ['#7dff00', '#00e676'],
  name: ['#ff4b1f', '#ffb000'],
  map: ['#ff2d55', '#ff8a00'],
  distance: ['#0a7cff', '#00d4ff'],
  pair: ['#ff2d75', '#ff4b2b'],
  origin: ['#ff4b1f', '#ffb000'],
  hour: ['#ffb000', '#ff2d75'],
  direct: ['#5a2bff', '#00d9ff'],
  longest: ['#ff1744', '#ffb000'],
  look: ['#ffb000', '#ff2d75'],
  eras: ['#ffb000', '#ff4b2b'],
  lines: ['#00e676', '#b6ff00'],
  awards: ['#ff1744', '#ffb000'],
  bookends: ['#0057ff', '#00c2ff'],
  comparison: ['#00e676', '#b6ff00'],
  crew: ['#5a2bff', '#00d9ff'],
  close: ['#0066ff', '#00e5ff'],
};

const LIFT: Record<FilmPlace, number> = { top: -1.05, center: 0, bottom: 1.0 };

interface Shape {
  points: THREE.Vector3[];
  width: number;
}

function v(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

/** Sample a Catmull-Rom path into the fixed number of points the ribbon mesh holds. */
function pathFrom(points: THREE.Vector3[], closed: boolean): THREE.Vector3[] {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal', 0.45);
  return curve.getPoints(SEGMENTS);
}

function wave(closed: boolean, fn: (t: number) => THREE.Vector3): THREE.Vector3[] {
  const controls: THREE.Vector3[] = [];
  const steps = 96;
  for (let i = 0; i < steps; i += 1) controls.push(fn(i / steps));
  return pathFrom(controls, closed);
}

function shapeFor(chapter: Chapter): Shape {
  const place = PLACE[chapter.id] ?? 'center';
  let points: THREE.Vector3[] = [];
  let width = 0.32;

  switch (chapter.id) {
    case 'cover':
      points = wave(false, (t) => {
        const angle = t * TAU * 2.4;
        return v(
          Math.cos(angle) * (2.05 + 0.3 * Math.sin(t * TAU * 3)),
          (t - 0.5) * 4.2,
          Math.sin(angle) * (1.15 + 0.25 * Math.sin(t * TAU * 3)),
        );
      });
      width = 0.42;
      break;

    case 'total':
      points = wave(false, (t) => {
        const angle = t * TAU * 4.4;
        const radius = 0.5 + 4.7 * t;
        return v(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, 0.48 * Math.sin(angle * 0.7));
      });
      width = 0.26;
      break;

    case 'name':
      points = wave(true, (t) => {
        const angle = t * TAU;
        const radius = 2.05 + 0.58 * Math.cos(3 * angle);
        return v(radius * Math.cos(2 * angle), radius * Math.sin(2 * angle) * 0.78, 0.8 * Math.sin(3 * angle));
      });
      width = 0.32;
      break;

    case 'map': {
      const stops = chapter.map?.stops ?? [];
      const controls = [...stops]
        .sort((a, b) => Math.atan2(a.y - 50, a.x - 50) - Math.atan2(b.y - 50, b.x - 50))
        .slice(0, 15)
        .map((stop) => v((stop.x - 50) / 11.5, (50 - stop.y) / 11.5, 0.3 * Math.sin(stop.x * 0.16)));
      points = controls.length >= 3
        ? pathFrom(controls, true)
        : wave(true, (t) => v(Math.cos(t * TAU) * 3.3, Math.sin(t * TAU) * 2.3, 0.4));
      width = 0.3;
      break;
    }

    case 'distance':
      points = wave(false, (t) => v(
        -6.4 + 12.8 * t,
        -1.55 + 2.9 * Math.sin(t * Math.PI) + 0.28 * Math.sin(t * TAU * 3),
        0.85 * Math.sin(t * TAU * 1.4),
      ));
      width = 0.3;
      break;

    case 'pair':
      points = wave(true, (t) => v(
        3.15 * Math.sin(t * TAU),
        1.95 * Math.sin(t * TAU * 2),
        0.62 * Math.cos(t * TAU),
      ));
      width = 0.3;
      break;

    case 'origin':
      points = wave(false, (t) => v(
        Math.cos(t * TAU * 3) * 1.5,
        -2.2 + 4.4 * t,
        Math.sin(t * TAU * 3) * 1.5,
      ));
      width = 0.28;
      break;

    case 'hour':
      points = wave(true, (t) => {
        const angle = t * TAU;
        const radius = 2.18 + 0.36 * (0.5 + 0.5 * Math.sin(24 * angle));
        return v(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.84, 0.3 * Math.sin(24 * angle));
      });
      width = 0.24;
      break;

    case 'direct':
      points = wave(false, (t) => v(
        -5.9 + 11.8 * t,
        2.75 - 5.5 * t + 0.14 * Math.sin(t * TAU * 4),
        0.42 * Math.sin(t * TAU * 2),
      ));
      width = 0.3;
      break;

    case 'longest':
      points = wave(true, (t) => v(
        4.85 * Math.cos(t * TAU),
        2.2 * Math.sin(t * TAU) + 0.4 * Math.sin(t * TAU * 3),
        0.9 * Math.sin(t * TAU * 1.5),
      ));
      width = 0.26;
      break;

    case 'look':
      points = wave(true, (t) => v(
        3.1 * Math.cos(t * TAU),
        2.25 * Math.sin(t * TAU),
        0.55 * Math.sin(t * TAU * 2),
      ));
      width = 0.3;
      break;

    case 'eras':
      points = wave(false, (t) => v(
        -5.6 + 11.2 * t,
        -2.4 + 2.7 * (0.5 + 0.5 * Math.sin(t * TAU * 3)),
        0.38 * Math.sin(t * TAU * 2),
      ));
      width = 0.34;
      break;

    case 'lines':
      points = wave(false, (t) => {
        const pass = Math.min(3, Math.floor(t * 4));
        const local = t * 4 - pass;
        const direction = pass % 2 === 0 ? 1 : -1;
        return v(
          direction * (-5.1 + 10.2 * local),
          2.75 - pass * 1.65,
          0.34 * Math.sin(local * Math.PI),
        );
      });
      width = 0.2;
      break;

    case 'awards':
      points = wave(false, (t) => {
        const loop = Math.min(3, Math.floor(t * 4));
        const local = t * 4 - loop;
        const angle = local * TAU;
        const centers = [[-2.1, 1.05], [2.1, 1.05], [-2.1, -1.35], [2.1, -1.35]];
        const [x, y] = centers[loop];
        return v(x + 0.92 * Math.cos(angle), y + 0.92 * Math.sin(angle), 0.35 * Math.sin(angle));
      });
      width = 0.24;
      break;

    case 'bookends': {
      const controls: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i += 1) {
        const angle = (i / 24) * Math.PI;
        controls.push(v(-3.15 + 1.65 * Math.cos(angle), -1.9 + 3.7 * Math.sin(angle), 0.1));
      }
      for (let i = 1; i <= 10; i += 1) {
        controls.push(v(-4.8 + (i / 10) * 9.6, -1.9, 0.1));
      }
      for (let i = 0; i <= 24; i += 1) {
        const angle = (i / 24) * Math.PI;
        controls.push(v(3.15 + 1.65 * Math.cos(angle), -1.9 + 3.7 * Math.sin(angle), -0.1));
      }
      points = pathFrom(controls, false);
      width = 0.3;
      break;
    }

    case 'comparison': {
      const controls: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i += 1) {
        controls.push(v(-2.15, -2.45 + (3.1 * i) / 16, 0.15));
      }
      for (let i = 1; i <= 14; i += 1) {
        controls.push(v(-2.15 + (4.3 * i) / 14, -2.45, 0.05));
      }
      for (let i = 0; i <= 16; i += 1) {
        controls.push(v(2.15, -2.45 + (5.3 * i) / 16, -0.1));
      }
      points = pathFrom(controls, false);
      width = 0.46;
      break;
    }

    case 'crew':
      points = wave(true, (t) => v(
        2.85 * Math.sin(t * TAU * 2),
        2.2 * Math.sin(t * TAU),
        0.72 * Math.cos(t * TAU * 2),
      ));
      width = 0.3;
      break;

    case 'close':
    default:
      points = wave(true, (t) => v(
        3.05 * Math.cos(t * TAU),
        2.22 * Math.sin(t * TAU),
        0.55 * Math.sin(t * TAU * 2),
      ));
      width = 0.28;
      break;
  }

  const lift = LIFT[place];
  return {
    points: points.map((point) => point.clone().add(new THREE.Vector3(0, lift, 0))),
    width,
  };
}

function ribbonGeometry(shape: Shape, from: string, to: string): {
  positions: Float32Array;
  colors: Float32Array;
  geometry: THREE.BufferGeometry;
} {
  const count = (SEGMENTS + 1) * 2;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(from);
  const colorB = new THREE.Color(to);
  const mixed = new THREE.Color();
  const closed = shape.points[0].distanceTo(shape.points[shape.points.length - 1]) < 0.0001;
  let firstNormal: THREE.Vector3 | null = null;
  let firstLeft: [number, number, number] | null = null;
  let firstRight: [number, number, number] | null = null;

  for (let i = 0; i <= SEGMENTS; i += 1) {
    const point = shape.points[Math.min(i, shape.points.length - 1)];
    const previous = shape.points[Math.max(0, i - 1)];
    const next = shape.points[Math.min(shape.points.length - 1, i + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const normal = tangent.clone().cross(CAMERA_DIR);
    if (normal.lengthSq() < 0.0001) normal.set(0, 1, 0);
    normal.normalize();
    if (i === 0) firstNormal = normal.clone();
    if (i === SEGMENTS && closed && firstNormal) normal.copy(firstNormal);

    const t = i / SEGMENTS;
    const width = shape.width * (0.78 + 0.22 * Math.sin(t * TAU * 2.2));
    const left = point.clone().addScaledVector(normal, width / 2);
    const right = point.clone().addScaledVector(normal, -width / 2);

    positions.set([left.x, left.y, left.z, right.x, right.y, right.z], i * 6);

    mixed.copy(colorA).lerp(colorB, t * 0.78);
    const leftColor: [number, number, number] = [mixed.r, mixed.g, mixed.b];
    mixed.copy(colorB).lerp(colorA, t * 0.64);
    const rightColor: [number, number, number] = [mixed.r, mixed.g, mixed.b];
    if (i === 0) {
      firstLeft = leftColor;
      firstRight = rightColor;
    }
    colors.set(closed && i === SEGMENTS && firstLeft && firstRight ? firstLeft : leftColor, i * 6);
    colors.set(closed && i === SEGMENTS && firstLeft && firstRight ? firstRight : rightColor, i * 6 + 3);
  }

  const indices = new Uint16Array(SEGMENTS * 6);
  for (let i = 0; i < SEGMENTS; i += 1) {
    const a = i * 2;
    indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return { positions, colors, geometry };
}

export function WrappedWorld({ chapter, still }: { chapter: Chapter; still: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const stillRef = useRef(still);
  const currentPositions = useRef<Float32Array>(new Float32Array(0));
  const currentColors = useRef<Float32Array>(new Float32Array(0));
  const targetPositions = useRef<Float32Array>(new Float32Array(0));
  const targetColors = useRef<Float32Array>(new Float32Array(0));
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    stillRef.current = still;
    if (still) renderRef.current?.();
  }, [still]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor(0x050506, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
    camera.position.set(0, 0, 13.2);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    scene.add(group);

    const first = shapeFor(chapter);
    const [firstFrom, firstTo] = TINT[chapter.id] ?? TINT.cover;
    const built = ribbonGeometry(first, firstFrom, firstTo);
    targetPositions.current = built.positions.slice();
    targetColors.current = built.colors.slice();
    /* Tick mutates these exact arrays, because the BufferAttributes own them. */
    currentPositions.current = built.positions;
    currentColors.current = built.colors;
    geometryRef.current = built.geometry;

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(built.geometry, material);
    group.add(mesh);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(3, 6, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.7);
    rim.position.set(-6, -3, 4);
    scene.add(rim);

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(box.width));
      const height = Math.max(1, Math.round(box.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const renderOnce = () => {
      renderer.render(scene, camera);
    };
    renderRef.current = renderOnce;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!stillRef.current) {
        const k = 1 - Math.exp(-dt * 7);
        const current = currentPositions.current;
        const target = targetPositions.current;
        const currentColor = currentColors.current;
        const targetColor = targetColors.current;
        for (let i = 0; i < current.length; i += 1) {
          current[i] += (target[i] - current[i]) * k;
          currentColor[i] += (targetColor[i] - currentColor[i]) * k;
        }
        built.geometry.attributes.position.needsUpdate = true;
        built.geometry.attributes.color.needsUpdate = true;
        built.geometry.computeVertexNormals();

        const seconds = now / 1000;
        group.rotation.y = Math.sin(seconds * 0.22) * 0.12;
        group.rotation.z = Math.sin(seconds * 0.17) * 0.018;
        group.scale.setScalar(1 + 0.008 * Math.sin(seconds * 1.25));
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      built.geometry.dispose();
      material.dispose();
      renderer.dispose();
      materialRef.current = null;
      geometryRef.current = null;
      renderRef.current = null;
    };
    // The scene is built once. Chapters morph the same mesh through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const target = shapeFor(chapter);
    const [from, to] = TINT[chapter.id] ?? TINT.cover;
    const built = ribbonGeometry(target, from, to);
    targetPositions.current = built.positions;
    targetColors.current = built.colors;

    if (stillRef.current) {
      currentPositions.current.set(built.positions);
      currentColors.current.set(built.colors);
      const position = geometryRef.current?.attributes.position;
      const color = geometryRef.current?.attributes.color;
      if (position) position.needsUpdate = true;
      if (color) color.needsUpdate = true;
      renderRef.current?.();
    }

    /* The arrays above are targets; the temporary geometry is not mounted. */
    built.geometry.dispose();
  }, [chapter.id]);

  return <canvas ref={ref} className="wrapped-world" data-shape={chapter.id} aria-hidden="true" />;
}
