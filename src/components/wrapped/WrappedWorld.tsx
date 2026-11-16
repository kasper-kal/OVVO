import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Chapter } from '../../lib/wrappedDeck';
import { PALETTES } from './WrappedScenes';

/*
 * **One camera, one year.**
 *
 * The world is a real 3D scene, not a different moving wallpaper behind each page. Five glossy
 * ribbons hang through the same dark volume for the whole film; the camera keeps drifting around
 * them and the palette changes as the story moves. A chapter is a place the camera passes through.
 *
 * The scene is deliberately small: five ribbon strips, a field of dust and two coloured lights.
 * That is enough to give the words depth without turning the yearbook into a game.
 */

function ribbonGeometry(curve: THREE.CatmullRomCurve3, width: number, segments = 240): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const point = curve.getPointAt(index / segments);
    const normal = frames.binormals[index] ?? frames.binormals[frames.binormals.length - 1];
    const wobble = 0.82 + Math.sin(index * 0.13 + width * 2.2) * 0.18;
    const half = width * 0.5 * wobble;
    positions.push(
      point.x + normal.x * half,
      point.y + normal.y * half,
      point.z + normal.z * half,
      point.x - normal.x * half,
      point.y - normal.y * half,
      point.z - normal.z * half,
    );
    uvs.push(0, index / segments, 1, index / segments);
    if (index < segments) {
      const a = index * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function curveFor(index: number, phase: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const y = (index - 2) * 1.35;
  for (let step = 0; step <= 14; step += 1) {
    const x = -8.6 + step * 1.24;
    points.push(
      new THREE.Vector3(
        x,
        y + Math.sin(step * 0.72 + phase) * 1.5 + Math.cos(step * 0.33 + phase * 0.7) * 0.55,
        Math.sin(step * 0.46 + phase) * 1.8 + (index - 2) * 0.7,
      ),
    );
  }
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.42);
}

const CAMERA_POSES: Record<string, { x: number; y: number; z: number }> = {
  cover: { x: 0, y: 0, z: 9.4 },
  total: { x: -0.7, y: 0.15, z: 8.5 },
  map: { x: 1.1, y: -0.25, z: 9.5 },
  distance: { x: 0, y: 0.35, z: 8.2 },
  pair: { x: -0.65, y: -0.25, z: 8.8 },
  origin: { x: 0.7, y: 0.55, z: 9.1 },
  hour: { x: 1.35, y: 0, z: 8.3 },
  longest: { x: -0.9, y: 0, z: 8.7 },
  look: { x: 0, y: 0, z: 9.6 },
  eras: { x: 0.55, y: 0.25, z: 8.9 },
  lines: { x: -0.75, y: -0.2, z: 8.4 },
  awards: { x: 0.95, y: -0.4, z: 9.0 },
  bookends: { x: -0.9, y: 0.15, z: 9.2 },
  compare: { x: 0.3, y: 0, z: 8.3 },
  crew: { x: -0.45, y: 0.2, z: 8.8 },
  close: { x: 0, y: 0, z: 10.1 },
};

function cameraPose(id: string): { x: number; y: number; z: number } {
  return { ...(CAMERA_POSES[id] ?? CAMERA_POSES.cover) };
}

function paletteColors(palette: [string, string, string]): THREE.Color[] {
  return palette.map((hex) => new THREE.Color(hex));
}

function dark(colors: THREE.Color[], amount: number): THREE.Color {
  return colors[1].clone().multiplyScalar(amount).add(new THREE.Color('#050506').multiplyScalar(1 - amount));
}

export function WrappedWorld({ chapter, still }: { chapter: Chapter; still: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const targetColors = useRef<THREE.Color[]>(paletteColors(PALETTES[chapter.id] ?? PALETTES.cover));
  const stillRef = useRef(still);
  const surge = useRef(0);
  const renderRef = useRef<(() => void) | null>(null);
  const poseTarget = useRef(cameraPose(chapter.id));
  const poseLive = useRef(cameraPose(chapter.id));

  useEffect(() => {
    targetColors.current = paletteColors(PALETTES[chapter.id] ?? PALETTES.cover);
    poseTarget.current = cameraPose(chapter.id);
    surge.current = 1;
    if (stillRef.current) renderRef.current?.();
  }, [chapter.id]);

  useEffect(() => {
    stillRef.current = still;
    if (still) renderRef.current?.();
  }, [still]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050506');
    scene.fog = new THREE.FogExp2('#050506', 0.055);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
    camera.position.set(0, 0, 8.8);

    const group = new THREE.Group();
    scene.add(group);

    /*
     * A flat coloured plane reads as a slide. The ribbon carries a soft woven gradient across its
     * width and a slow drift along its length, so the folds catch light as the camera moves.
     */
    const cloth = document.createElement('canvas');
    cloth.width = 16;
    cloth.height = 256;
    const clothCtx = cloth.getContext('2d');
    if (clothCtx) {
      const across = clothCtx.createLinearGradient(0, 0, 16, 0);
      across.addColorStop(0, '#181818');
      across.addColorStop(0.22, '#8a8a8a');
      across.addColorStop(0.48, '#ffffff');
      across.addColorStop(0.72, '#8a8a8a');
      across.addColorStop(1, '#181818');
      clothCtx.fillStyle = across;
      clothCtx.fillRect(0, 0, 16, 256);
      clothCtx.globalAlpha = 0.14;
      for (let y = 0; y < 256; y += 5) {
        clothCtx.fillStyle = y % 10 === 0 ? '#ffffff' : '#000000';
        clothCtx.fillRect(0, y, 16, 1);
      }
    }
    const clothTexture = new THREE.CanvasTexture(cloth);
    clothTexture.colorSpace = THREE.SRGBColorSpace;
    clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.repeat.set(1, 3);
    clothTexture.anisotropy = 4;

    const colors = targetColors.current;
    const materials: THREE.MeshPhysicalMaterial[] = [];
    const ribbons: THREE.Mesh[] = [];
    for (let index = 0; index < 5; index += 1) {
      const color = colors[index % colors.length];
      const material = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.08,
        map: clothTexture,
        roughness: 0.32,
        metalness: 0.22,
        clearcoat: 0.8,
        clearcoatRoughness: 0.22,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(ribbonGeometry(curveFor(index, index * 1.7 + 0.4), 0.72 + (index % 3) * 0.22), material);
      mesh.position.z = -1.4 + index * 0.55;
      mesh.rotation.z = (index - 2) * 0.035;
      group.add(mesh);
      materials.push(material);
      ribbons.push(mesh);
    }

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(220 * 3);
    for (let index = 0; index < 220; index += 1) {
      dustPositions[index * 3] = (Math.random() - 0.5) * 18;
      dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 11;
      dustPositions[index * 3 + 2] = -8 + Math.random() * 12;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: colors[1],
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 5, 7);
    scene.add(key);
    const left = new THREE.PointLight(colors[0], 34, 28);
    left.position.set(-5.5, -2.5, 4);
    scene.add(left);
    const right = new THREE.PointLight(colors[2], 30, 28);
    right.position.set(5.5, 3, 3);
    scene.add(right);

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      render();
    };

    const render = () => {
      renderer.render(scene, camera);
    };
    renderRef.current = render;

    const clock = new THREE.Clock();
    let frame = 0;
    const paint = () => {
      const elapsed = clock.getElapsedTime();
      const stillNow = stillRef.current;
      const t = stillNow ? 1.4 : elapsed;
      const target = targetColors.current;

      materials.forEach((material, index) => {
        const color = target[index % target.length];
        material.color.lerp(color, 0.045);
        material.emissive.lerp(color, 0.045);
        material.emissiveIntensity = 0.06 + Math.sin(t * 0.6 + index) * 0.02;
      });
      left.color.lerp(target[0], 0.04);
      right.color.lerp(target[2], 0.04);
      dustMaterial.color.lerp(target[1], 0.04);
      scene.background = dark(target, 0.72);
      (scene.fog as THREE.FogExp2).color = dark(target, 0.72);
      ambient.color.lerp(target[1], 0.02);

      const drift = stillNow ? 0 : t;
      group.rotation.y = Math.sin(drift * 0.09) * 0.1;
      group.rotation.x = Math.sin(drift * 0.07) * 0.045;
      group.rotation.z = Math.cos(drift * 0.06) * 0.035;
      ribbons.forEach((ribbon, index) => {
        ribbon.rotation.z = (index - 2) * 0.035 + Math.sin(drift * 0.12 + index) * 0.025;
      });
      dust.rotation.y = drift * 0.012;
      dust.rotation.z = drift * 0.008;
      clothTexture.offset.y = (drift * 0.012) % 1;

      surge.current = Math.max(0, surge.current - 0.012);
      const push = surge.current * 0.75;
      const pose = poseLive.current;
      const targetPose = poseTarget.current;
      pose.x += (targetPose.x - pose.x) * 0.055;
      pose.y += (targetPose.y - pose.y) * 0.055;
      pose.z += (targetPose.z - pose.z) * 0.055;
      camera.position.x = pose.x + Math.sin(t * 0.16) * 1.15;
      camera.position.y = pose.y + Math.cos(t * 0.12) * 0.45;
      camera.position.z = pose.z + Math.sin(t * 0.08) * 0.3 - push;
      camera.lookAt(0, 0, 0);
      render();
      if (!stillNow) frame = requestAnimationFrame(paint);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(paint);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      renderRef.current = null;
      dustGeometry.dispose();
      dustMaterial.dispose();
      ribbons.forEach((ribbon) => ribbon.geometry.dispose());
      materials.forEach((material) => material.dispose());
      clothTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="wrapped-world" aria-hidden="true" />;
}
