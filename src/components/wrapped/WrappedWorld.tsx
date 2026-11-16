import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Chapter } from '../../lib/wrappedDeck';
import { PALETTES } from './WrappedScenes';

/*
 * **One camera, many rooms.**
 *
 * The first WebGL pass kept the same five ribbons for the whole year and only changed their colour.
 * That is still one background. Each chapter now gets its own set: a galaxy of journeys, a
 * constellation, two portals, station columns, a clock, a tunnel, colour strata, rails, medals,
 * arches, towers or two linked spheres. The renderer and camera never remount, so the year is still
 * one continuous film; only the room the camera is flying through changes.
 */

type SetBundle = {
  group: THREE.Group;
  update: (t: number, surge: number) => void;
  dispose: () => void;
};

function makeBundle(): SetBundle & { add: (object: THREE.Object3D) => THREE.Object3D } {
  const group = new THREE.Group();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  const add = (object: THREE.Object3D) => {
    group.add(object);
    object.traverse((child) => {
      const part = child as THREE.Object3D & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      };
      if (part.geometry) geometries.add(part.geometry);
      if (Array.isArray(part.material)) part.material.forEach((material) => materials.add(material));
      else if (part.material) materials.add(part.material);
    });
    return object;
  };

  return {
    group,
    add,
    update: () => {},
    dispose: () => {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

function surface(color: THREE.Color, options: Record<string, unknown> = {}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.26,
    metalness: 0.22,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    emissive: color.clone().multiplyScalar(0.06),
    side: THREE.DoubleSide,
    ...options,
  } as THREE.MeshPhysicalMaterialParameters);
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

function ribbonGeometry(curve: THREE.CatmullRomCurve3, width: number, segments = 220): THREE.BufferGeometry {
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

function clothTexture(): THREE.CanvasTexture {
  const cloth = document.createElement('canvas');
  cloth.width = 16;
  cloth.height = 256;
  const context = cloth.getContext('2d');
  if (context) {
    const across = context.createLinearGradient(0, 0, 16, 0);
    across.addColorStop(0, '#151515');
    across.addColorStop(0.22, '#8a8a8a');
    across.addColorStop(0.48, '#ffffff');
    across.addColorStop(0.72, '#8a8a8a');
    across.addColorStop(1, '#151515');
    context.fillStyle = across;
    context.fillRect(0, 0, 16, 256);
    context.globalAlpha = 0.12;
    for (let y = 0; y < 256; y += 5) {
      context.fillStyle = y % 10 === 0 ? '#ffffff' : '#000000';
      context.fillRect(0, y, 16, 1);
    }
  }
  const texture = new THREE.CanvasTexture(cloth);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  texture.anisotropy = 4;
  return texture;
}

function ribbonSet(colors: THREE.Color[], texture: THREE.CanvasTexture, count: number): SetBundle {
  const bundle = makeBundle();
  const ribbons: THREE.Mesh[] = [];
  for (let index = 0; index < count; index += 1) {
    const material = surface(colors[index % colors.length], {
      map: texture,
      transparent: true,
      opacity: 0.94,
      roughness: 0.32,
      metalness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.22,
    });
    const mesh = new THREE.Mesh(
      ribbonGeometry(curveFor(count === 1 ? 2 : index, index * 1.7 + 0.4), count === 1 ? 1.25 : 0.72 + (index % 3) * 0.22),
      material,
    );
    mesh.position.z = -1.4 + index * 0.55;
    mesh.rotation.z = (index - 2) * 0.035;
    bundle.add(mesh);
    ribbons.push(mesh);
  }
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.09) * 0.1;
    bundle.group.rotation.x = Math.sin(t * 0.07) * 0.045;
    ribbons.forEach((ribbon, index) => {
      ribbon.rotation.z = (index - 2) * 0.035 + Math.sin(t * 0.12 + index) * 0.025;
    });
  };
  return bundle;
}

function totalSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const positions: number[] = [];
  for (let index = 0; index < 520; index += 1) {
    const angle = index * 0.31;
    const radius = 0.35 + Math.sqrt(index) * 0.2;
    positions.push(
      Math.cos(angle) * radius,
      Math.sin(index * 0.58) * 0.9 + Math.sin(angle * 0.7) * 0.5,
      Math.sin(angle) * radius * 0.7,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: colors[1],
    size: 0.045,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  bundle.add(new THREE.Points(geometry, material));

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.008, 8, 160),
    surface(new THREE.Color('#f7f3ea'), { emissiveIntensity: 0.2 }),
  );
  ring.rotation.x = Math.PI / 2.6;
  bundle.add(ring);
  bundle.update = (t) => {
    bundle.group.rotation.y = t * 0.035;
    bundle.group.rotation.z = Math.sin(t * 0.1) * 0.05;
    ring.scale.setScalar(1 + Math.sin(t * 0.5) * 0.035);
  };
  return bundle;
}

function nameSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.75, 0.28, 220, 28),
    surface(colors[0], { roughness: 0.18, metalness: 0.35, clearcoat: 0.9 }),
  );
  bundle.add(knot);
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2, 1),
    new THREE.MeshBasicMaterial({ color: colors[2], wireframe: true, transparent: true, opacity: 0.13 }),
  );
  bundle.add(shell);
  bundle.update = (t) => {
    knot.rotation.x = t * 0.12;
    knot.rotation.y = t * 0.18;
    shell.rotation.x = -t * 0.04;
    shell.rotation.y = -t * 0.07;
  };
  return bundle;
}

function mapSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const nodes: THREE.Vector3[] = [];
  for (let index = 0; index < 38; index += 1) {
    const angle = index * 2.399;
    const radius = 0.7 + (index % 9) * 0.32;
    nodes.push(
      new THREE.Vector3(
        Math.cos(angle) * radius + Math.sin(index * 0.8) * 0.35,
        Math.sin(index * 1.7) * 1.2,
        Math.sin(angle) * radius * 0.55 - 0.4,
      ),
    );
  }

  const nodeGeometry = new THREE.SphereGeometry(0.055, 12, 12);
  const nodeMaterial = surface(new THREE.Color('#f7f3ea'), { emissiveIntensity: 0.4 });
  const nodeMeshes: THREE.Mesh[] = [];
  nodes.forEach((node, index) => {
    const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
    mesh.position.copy(node);
    if (index === 17) mesh.scale.setScalar(2.5);
    bundle.add(mesh);
    nodeMeshes.push(mesh);
  });

  const linePositions: number[] = [];
  nodes.forEach((node, index) => {
    if (index === 0) return;
    const from = nodes[index - 1];
    linePositions.push(from.x, from.y, from.z, node.x, node.y, node.z);
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  bundle.add(
    new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: colors[2], transparent: true, opacity: 0.34 }),
    ),
  );

  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.11) * 0.24;
    bundle.group.rotation.x = Math.sin(t * 0.08) * 0.12;
    nodeMeshes.forEach((node, index) => {
      if (index === 17) node.scale.setScalar(2.2 + Math.sin(t * 1.4) * 0.35);
    });
  };
  return bundle;
}

function distanceSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.2, -1.7, -0.5),
    new THREE.Vector3(-2.8, -0.4, 0.8),
    new THREE.Vector3(0, -2.2, -1.2),
    new THREE.Vector3(2.9, 0.5, 0.4),
    new THREE.Vector3(5.2, -1.1, -0.3),
  ]);
  bundle.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(curve, 120, 0.055, 10, false),
      surface(new THREE.Color('#f7f3ea'), { emissiveIntensity: 0.3 }),
    ),
  );
  [
    new THREE.Vector3(-5.2, -1.7, -0.5),
    new THREE.Vector3(5.2, -1.1, -0.3),
  ].forEach((point) => {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 20),
      surface(colors[2], { emissiveIntensity: 0.4 }),
    );
    node.position.copy(point);
    bundle.add(node);
  });
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.08) * 0.16;
    bundle.group.rotation.z = Math.sin(t * 0.11) * 0.03;
  };
  return bundle;
}

function pairSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const left = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.07, 20, 80),
    surface(colors[0], { emissiveIntensity: 0.18 }),
  );
  left.position.x = -2.25;
  bundle.add(left);
  const right = left.clone();
  right.position.x = 2.25;
  bundle.add(right);
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 4.5, 8),
    new THREE.MeshBasicMaterial({ color: colors[2] }),
  );
  bridge.rotation.z = Math.PI / 2;
  bundle.add(bridge);
  bundle.update = (t) => {
    left.rotation.z = t * 0.08;
    right.rotation.z = -t * 0.08;
    bundle.group.rotation.y = Math.sin(t * 0.12) * 0.22;
  };
  return bundle;
}

function originSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const heights = [2.2, 3.1, 2.6, 3.7, 2.8, 3.4, 2.4];
  heights.forEach((height, index) => {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, height, 0.28),
      surface(colors[index % colors.length], { roughness: 0.4, metalness: 0.15 }),
    );
    column.position.set((index - 3) * 0.82, height / 2 - 1.8, (index % 2) * 0.4 - 0.2);
    bundle.add(column);
  });
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.035, 0.035),
    new THREE.MeshBasicMaterial({ color: colors[2] }),
  );
  line.position.y = 1.5;
  bundle.add(line);
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.1) * 0.2;
    bundle.group.rotation.x = Math.sin(t * 0.07) * 0.04;
  };
  return bundle;
}

function hourSet(colors: THREE.Color[], chapter: Chapter): SetBundle {
  const bundle = makeBundle();
  const bars = chapter.bars ?? Array.from({ length: 24 }, () => 1);
  const max = Math.max(1, ...bars);
  const peak = chapter.peak ?? 0;
  let peakMesh: THREE.Mesh | null = null;
  bars.forEach((value, index) => {
    const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
    const length = 0.35 + (value / max) * 1.8;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, length, 0.1),
      surface(index === peak ? new THREE.Color('#f7f3ea') : colors[1], { emissiveIntensity: index === peak ? 0.5 : 0.08 }),
    );
    mesh.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
    mesh.rotation.z = angle + Math.PI / 2;
    bundle.add(mesh);
    if (index === peak) peakMesh = mesh;
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.012, 8, 120),
    new THREE.MeshBasicMaterial({ color: colors[2], transparent: true, opacity: 0.5 }),
  );
  bundle.add(ring);
  bundle.update = (t) => {
    bundle.group.rotation.z = t * 0.035;
    bundle.group.rotation.y = Math.sin(t * 0.08) * 0.16;
    if (peakMesh) peakMesh.scale.y = 1.12 + Math.sin(t * 2.1) * 0.18;
  };
  return bundle;
}

function directSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  for (let index = 0; index < 15; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.25 + index * 0.26, 0.012, 8, 80),
      surface(index % 3 === 0 ? colors[2] : new THREE.Color('#f7f3ea'), { emissiveIntensity: 0.1 }),
    );
    ring.position.z = -index * 0.35;
    bundle.add(ring);
  }
  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 8, 8),
    new THREE.MeshBasicMaterial({ color: colors[2], transparent: true, opacity: 0.65 }),
  );
  center.rotation.x = Math.PI / 2;
  bundle.add(center);
  bundle.update = (t) => {
    bundle.group.rotation.z = Math.sin(t * 0.1) * 0.04;
    bundle.group.rotation.y = Math.sin(t * 0.09) * 0.08;
  };
  return bundle;
}

function longestSet(colors: THREE.Color[], texture: THREE.CanvasTexture): SetBundle {
  const bundle = ribbonSet(colors, texture, 1);
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.12) * 0.25;
    bundle.group.rotation.z = Math.sin(t * 0.08) * 0.05;
  };
  return bundle;
}

function erasSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  for (let index = 0; index < 6; index += 1) {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.12, 1.6),
      surface(colors[index % colors.length], { roughness: 0.5, metalness: 0.1 }),
    );
    slab.position.y = (index - 2.5) * 0.78;
    slab.rotation.y = (index - 2.5) * 0.06;
    bundle.add(slab);
  }
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.08) * 0.22;
    bundle.group.rotation.z = Math.sin(t * 0.1) * 0.03;
  };
  return bundle;
}

function linesSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  for (let index = 0; index < 7; index += 1) {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 10, 8),
      surface(index === 3 ? new THREE.Color('#f7f3ea') : colors[1], { emissiveIntensity: 0.15 }),
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, (index - 3) * 0.5, (index - 3) * 0.35);
    bundle.add(rail);
  }
  const cross = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 5, 8),
    new THREE.MeshBasicMaterial({ color: colors[2] }),
  );
  cross.position.y = -1.5;
  bundle.add(cross);
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.09) * 0.18;
    bundle.group.rotation.x = Math.sin(t * 0.11) * 0.03;
  };
  return bundle;
}

function awardsSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const medals: THREE.Object3D[] = [];
  for (let index = 0; index < 3; index += 1) {
    const medal = new THREE.Group();
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.1, 16, 48),
      surface(colors[index % colors.length], { metalness: 0.42, roughness: 0.18 }),
    );
    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 28, 28),
      surface(new THREE.Color('#f7f3ea'), { emissiveIntensity: 0.2 }),
    );
    medal.add(rim, face);
    medal.position.set((index - 1) * 2.3, Math.sin(index * 1.6) * 0.6, (index - 1) * 0.6);
    medal.rotation.z = index * 0.35 - 0.3;
    bundle.add(medal);
    medals.push(medal);
  }
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.1) * 0.25;
    medals.forEach((medal, index) => {
      medal.rotation.y = t * (0.12 + index * 0.03);
    });
  };
  return bundle;
}

function bookendsSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  [-2.35, 2.35].forEach((x, index) => {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.07, 16, 64, Math.PI),
      surface(colors[index], { emissiveIntensity: 0.16 }),
    );
    arch.position.set(x, -0.4, 0);
    bundle.add(arch);
  });
  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 4.7, 8),
    new THREE.MeshBasicMaterial({ color: colors[2] }),
  );
  line.rotation.z = Math.PI / 2;
  line.position.y = -1.55;
  bundle.add(line);
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.1) * 0.2;
    bundle.group.rotation.z = Math.sin(t * 0.08) * 0.03;
  };
  return bundle;
}

function comparisonSet(colors: THREE.Color[], chapter: Chapter): SetBundle {
  const bundle = makeBundle();
  const data = chapter.comparison;
  const now = data?.journeys ?? 100;
  const before = data?.previousJourneys ?? 80;
  const max = Math.max(now, before, 1);
  [
    { value: before, x: -1.5, color: colors[0] },
    { value: now, x: 1.5, color: new THREE.Color('#f7f3ea') },
  ].forEach((tower) => {
    const height = 1.2 + (tower.value / max) * 3.8;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, height, 0.95),
      surface(tower.color, { roughness: 0.38, metalness: 0.25 }),
    );
    mesh.position.set(tower.x, height / 2 - 2.4, 0);
    bundle.add(mesh);
  });
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.08) * 0.3;
    bundle.group.rotation.x = Math.sin(t * 0.06) * 0.03;
  };
  return bundle;
}

function crewSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const spheres: THREE.Mesh[] = [];
  [-1.65, 1.65].forEach((x, index) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, 48, 48),
      surface(colors[index], {
        transparent: true,
        opacity: 0.34,
        roughness: 0.12,
        metalness: 0.35,
        clearcoat: 1,
      }),
    );
    sphere.position.x = x;
    bundle.add(sphere);
    spheres.push(sphere);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.012, 8, 80),
      new THREE.MeshBasicMaterial({ color: colors[2], transparent: true, opacity: 0.45 }),
    );
    halo.position.x = x;
    halo.rotation.x = Math.PI / 2.4;
    bundle.add(halo);
  });
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 1.3, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#f7f3ea') }),
  );
  bridge.rotation.z = Math.PI / 2;
  bundle.add(bridge);
  bundle.update = (t) => {
    bundle.group.rotation.y = Math.sin(t * 0.1) * 0.18;
    spheres.forEach((sphere, index) => {
      sphere.rotation.y = t * (0.12 + index * 0.05);
    });
  };
  return bundle;
}

function closeSet(colors: THREE.Color[]): SetBundle {
  const bundle = makeBundle();
  const positions: number[] = [];
  for (let index = 0; index < 640; index += 1) {
    positions.push(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 9,
      -6 + Math.random() * 8,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color('#f7f3ea'),
    size: 0.035,
    transparent: true,
    opacity: 0.64,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  bundle.add(new THREE.Points(geometry, material));
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3, 0.01, 8, 180),
    new THREE.MeshBasicMaterial({ color: colors[2], transparent: true, opacity: 0.56 }),
  );
  ring.rotation.x = 1.1;
  bundle.add(ring);
  bundle.update = (t) => {
    bundle.group.rotation.y = t * 0.018;
    ring.rotation.z = t * 0.04;
  };
  return bundle;
}

const POSES: Record<string, { x: number; y: number; z: number }> = {
  cover: { x: 0, y: 0, z: 9.4 },
  total: { x: 0.3, y: 0.2, z: 9.2 },
  name: { x: 0, y: 0, z: 8.8 },
  map: { x: 0.2, y: 0.1, z: 9.5 },
  distance: { x: 0, y: 0.3, z: 9.8 },
  pair: { x: 0, y: 0, z: 9.2 },
  origin: { x: 0.2, y: 0.15, z: 8.8 },
  hour: { x: 0, y: 0, z: 9.1 },
  direct: { x: 0, y: 0, z: 8.7 },
  longest: { x: 0, y: 0, z: 9.4 },
  look: { x: 0, y: 0, z: 10.2 },
  eras: { x: 0, y: 0.2, z: 9.3 },
  lines: { x: 0, y: 0, z: 8.6 },
  awards: { x: 0, y: 0.1, z: 9.3 },
  bookends: { x: 0, y: 0, z: 9.4 },
  comparison: { x: 0, y: 0, z: 9.7 },
  crew: { x: 0, y: 0, z: 9.3 },
  close: { x: 0, y: 0, z: 10.4 },
};

function poseFor(id: string): { x: number; y: number; z: number } {
  return { ...(POSES[id] ?? POSES.cover) };
}

function dark(colors: THREE.Color[], amount: number): THREE.Color {
  return colors[1].clone().multiplyScalar(amount).add(new THREE.Color('#050506').multiplyScalar(1 - amount));
}

function buildSet(chapter: Chapter, colors: THREE.Color[], texture: THREE.CanvasTexture): SetBundle {
  switch (chapter.id) {
    case 'cover':
      return ribbonSet(colors, texture, 5);
    case 'total':
      return totalSet(colors);
    case 'name':
      return nameSet(colors);
    case 'map':
      return mapSet(colors);
    case 'distance':
      return distanceSet(colors);
    case 'pair':
      return pairSet(colors);
    case 'origin':
      return originSet(colors);
    case 'hour':
      return hourSet(colors, chapter);
    case 'direct':
      return directSet(colors);
    case 'longest':
      return longestSet(colors, texture);
    case 'look':
      return makeBundle();
    case 'eras':
      return erasSet(colors);
    case 'lines':
      return linesSet(colors);
    case 'awards':
      return awardsSet(colors);
    case 'bookends':
      return bookendsSet(colors);
    case 'comparison':
      return comparisonSet(colors, chapter);
    case 'crew':
      return crewSet(colors);
    case 'close':
      return closeSet(colors);
    default:
      return closeSet(colors);
  }
}

export function WrappedWorld({ chapter, still }: { chapter: Chapter; still: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const targetColors = useRef<THREE.Color[]>(
    (PALETTES[chapter.id] ?? PALETTES.cover).map((hex) => new THREE.Color(hex)),
  );
  const stillRef = useRef(still);
  const rebuildRef = useRef<(next: Chapter) => void>(() => {});
  const renderRef = useRef<(() => void) | null>(null);
  const poseTarget = useRef(poseFor(chapter.id));
  const poseLive = useRef(poseFor(chapter.id));
  const surge = useRef(1);

  useEffect(() => {
    targetColors.current = (PALETTES[chapter.id] ?? PALETTES.cover).map((hex) => new THREE.Color(hex));
    poseTarget.current = poseFor(chapter.id);
    surge.current = 1;
    rebuildRef.current(chapter);
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
    scene.fog = new THREE.FogExp2('#050506', 0.045);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
    camera.position.set(0, 0, 9.2);

    const texture = clothTexture();
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(230 * 3);
    for (let index = 0; index < 230; index += 1) {
      dustPositions[index * 3] = (Math.random() - 0.5) * 18;
      dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 11;
      dustPositions[index * 3 + 2] = -8 + Math.random() * 12;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: targetColors.current[1],
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(4, 5, 7);
    const leftLight = new THREE.PointLight(targetColors.current[0], 32, 28);
    leftLight.position.set(-5.5, -2.5, 4);
    const rightLight = new THREE.PointLight(targetColors.current[2], 28, 28);
    rightLight.position.set(5.5, 3, 3);
    scene.add(ambient, key, leftLight, rightLight);

    let bundle: SetBundle = makeBundle();
    scene.add(bundle.group);

    const setMood = () => {
      const colors = targetColors.current;
      scene.background = dark(colors, 0.66);
      (scene.fog as THREE.FogExp2).color = dark(colors, 0.66);
      dustMaterial.color.copy(colors[1]);
      leftLight.color.copy(colors[0]);
      rightLight.color.copy(colors[2]);
      ambient.color.copy(colors[1]);
      canvas.dataset.world = chapter.id;
    };

    rebuildRef.current = (next) => {
      bundle.dispose();
      scene.remove(bundle.group);
      bundle = buildSet(next, targetColors.current, texture);
      scene.add(bundle.group);
      setMood();
      canvas.dataset.world = next.id;
    };

    const render = () => renderer.render(scene, camera);
    renderRef.current = render;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      render();
    };

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    setMood();
    rebuildRef.current(chapter);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const clock = new THREE.Clock();
    let frame = 0;
    const paint = () => {
      const stillNow = stillRef.current;
      const t = stillNow ? 2.4 : clock.getElapsedTime();
      const drift = stillNow ? 0 : t;
      surge.current = Math.max(0, surge.current - 0.012);
      bundle.update(drift, surge.current);
      const pose = poseLive.current;
      const target = poseTarget.current;
      pose.x += (target.x - pose.x) * 0.055;
      pose.y += (target.y - pose.y) * 0.055;
      pose.z += (target.z - pose.z) * 0.055;
      camera.position.x = pose.x + Math.sin(t * 0.16) * 0.55;
      camera.position.y = pose.y + Math.cos(t * 0.12) * 0.32;
      camera.position.z = pose.z + Math.sin(t * 0.08) * 0.22 - surge.current * 0.35;
      camera.lookAt(0, 0, 0);
      dust.rotation.y = drift * 0.012;
      dust.rotation.z = drift * 0.008;
      texture.offset.y = (drift * 0.012) % 1;
      renderer.render(scene, camera);
      if (!stillNow) frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      bundle.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      texture.dispose();
      renderRef.current = null;
      rebuildRef.current = () => {};
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="wrapped-world" aria-hidden="true" />;
}
