"""
**Backdrop plates, modelled and rendered in Blender.**

The first version of this script stacked cubes and called it a render, which is why the cards still
looked like blocks. This one builds shapes that only a modeller can make: ribbons swept along a
Bezier curve, blobs welded from metaballs, a dune field displaced by a noise texture, arches cut from
a torus ring, tapered columns, a fan of cones, and a scatter of spheres for stars.

Each is lit by a key light, a rim light behind it (so an edge catches), and a soft white world. The
materials are glossy with a rough, uneven finish, so light slides across a surface instead of sitting
flat on it. A haze cube gives the air a little weight, and the compositor adds grain.

The plates are greyscale on white: the page tints them into each chapter's colour. Run:

    blender -b -P scripts/render-backdrops.py

Out: public/wrapped-scenes/<kind>.png
"""

import math
import os
import random

import bpy
from mathutils import Vector

OUT = os.path.join(os.getcwd(), "public", "wrapped-scenes")
os.makedirs(OUT, exist_ok=True)

W, H = 600, 1300
SAMPLES = 40


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"

    world = bpy.data.worlds.new("ovvo-world")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (1, 1, 1, 1)
    bg.inputs["Strength"].default_value = 0.75
    scene.world = world

    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 2.0
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (0, -10, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Key: big and close, so shadows are soft rather than graphic.
    key_data = bpy.data.lights.new("key", type="AREA")
    key_data.size = 5.0
    key_data.energy = 420
    key = bpy.data.objects.new("key", key_data)
    key.location = (2.4, -3.0, 2.2)
    key.rotation_euler = (math.radians(50), 0, math.radians(36))
    scene.collection.objects.link(key)

    # Rim: behind and to the left, to draw a bright edge along every silhouette.
    rim_data = bpy.data.lights.new("rim", type="AREA")
    rim_data.size = 3.0
    rim_data.energy = 260
    rim = bpy.data.objects.new("rim", rim_data)
    rim.location = (-2.6, 2.4, 1.4)
    rim.rotation_euler = (math.radians(115), 0, math.radians(-40))
    scene.collection.objects.link(rim)

    return scene


def material(name, grey, roughness=0.45, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (grey, grey, grey, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def ribbons(rng):
    """Three ribbons swept along twisting curves, the biggest-day card's shape."""
    for i in range(3):
        curve = bpy.data.curves.new(f"ribbon{i}", "CURVE")
        curve.dimensions = "3D"
        curve.resolution_u = 24
        curve.bevel_depth = 0.075 - i * 0.012
        curve.bevel_resolution = 8

        spline = curve.splines.new("BEZIER")
        spline.bezier_points.add(3)
        pts = [
            (-1.1, 0.0 + i * 0.06, 0.95 - i * 0.16),
            (-0.35, 0.0, 0.55 - i * 0.10),
            (0.35, 0.0, 0.72 - i * 0.22),
            (1.1, 0.0, 0.30 - i * 0.12),
        ]
        for point, co in zip(spline.bezier_points, pts):
            point.co = Vector(co)
            point.handle_left_type = "AUTO"
            point.handle_right_type = "AUTO"
            point.radius = 1.0 - 0.25 * abs(co[2])

        obj = bpy.data.objects.new(f"ribbon{i}", curve)
        obj.data.materials.append(material(f"m-rib{i}", 0.30 + i * 0.14, 0.28 - i * 0.04, 0.25))
        bpy.context.scene.collection.objects.link(obj)

    floor = bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0.4, -1.1))
    bpy.context.object.data.materials.append(material("m-floor", 0.62, 0.7))


def blobs(rng):
    """Soft organic forms welded from metaballs, rounded, not boxy."""
    meta = bpy.data.metaballs.new("blobs")
    meta.resolution = 0.06
    meta.render_resolution = 0.03
    obj = bpy.data.objects.new("blobs", meta)
    bpy.context.scene.collection.objects.link(obj)

    for i in range(7):
        el = meta.elements.new()
        el.co = (rng.uniform(-1.0, 1.0), rng.uniform(-0.2, 0.2), rng.uniform(-0.9, 0.9))
        el.radius = rng.uniform(0.22, 0.5)
        el.stiffness = rng.uniform(1.2, 2.4)

    obj.data.materials.append(material("m-blob", 0.42, 0.3, 0.1))


def dunes(rng):
    """A dune field: a subdivided plane pushed by a noise texture and smoothed."""
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, -0.6))
    plane = bpy.context.object
    plane.rotation_euler = (math.radians(62), 0, 0)

    sub = plane.modifiers.new("sub", "SUBSURF")
    sub.levels = 6
    sub.render_levels = 7

    tex = bpy.data.textures.new("dune-noise", type="CLOUDS")
    tex.noise_scale = 0.9
    disp = plane.modifiers.new("disp", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.55
    disp.mid_level = 0.3

    bpy.ops.object.shade_smooth()
    plane.data.materials.append(material("m-dune", 0.5, 0.55))


def arches(rng):
    """Standing arches cut from torus rings, each turned to face the camera at an angle."""
    for i in range(3):
        bpy.ops.mesh.primitive_torus_add(
            location=(0.0, 0.1 + i * 0.3, -0.85 + i * 0.08),
            major_radius=0.62 - i * 0.13,
            minor_radius=0.11 - i * 0.02,
            major_segments=64,
            minor_segments=18,
        )
        ring = bpy.context.object
        ring.rotation_euler = (math.radians(90), 0, 0)
        # Only the top half of the ring is kept: an arch, not a hoop.
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.bisect(plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True, use_fill=True)
        bpy.ops.object.mode_set(mode="OBJECT")
        bpy.ops.object.shade_smooth()
        ring.data.materials.append(material(f"m-arch{i}", 0.36 + i * 0.13, 0.4, 0.15))


def columns(rng):
    """Tapered columns of different heights, with a stepped cap on each."""
    for i in range(9):
        h = rng.uniform(0.35, 1.5)
        bpy.ops.mesh.primitive_cone_add(
            vertices=32,
            radius1=0.09,
            radius2=rng.uniform(0.05, 0.12),
            depth=h,
            location=(-0.95 + i * 0.24, 0.1, -1.0 + h / 2),
        )
        col = bpy.context.object
        bpy.ops.object.shade_smooth()
        col.data.materials.append(material(f"m-col{i}", rng.uniform(0.3, 0.7), rng.uniform(0.25, 0.6), 0.1))


def rays(rng):
    """A fan of cones, a sunburst that has been modelled rather than drawn."""
    for i in range(7):
        ang = -55 + i * 18
        bpy.ops.mesh.primitive_cone_add(
            vertices=3,
            radius1=0.6,
            radius2=0.02,
            depth=2.2,
            location=(-0.35, 0.1 + i * 0.05, -0.55),
        )
        ray = bpy.context.object
        ray.rotation_euler = (math.radians(90), math.radians(ang), 0)
        bpy.ops.object.shade_smooth()
        ray.data.materials.append(material(f"m-ray{i}", 0.34 + i * 0.06, 0.5, 0.05))


def stars(rng):
    """A scatter of small spheres with one large soft sphere behind them."""
    for i in range(90):
        r = rng.uniform(0.012, 0.05)
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12,
            ring_count=8,
            radius=r,
            location=(rng.uniform(-1.05, 1.05), rng.uniform(0.0, 0.6), rng.uniform(-1.05, 1.05)),
        )
        bpy.ops.object.shade_smooth()
    big = bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.42, location=(-0.2, 0.9, 0.1))
    bpy.ops.object.shade_smooth()
    bpy.context.object.data.materials.append(material("m-orb", 0.8, 0.15, 0.0))


KINDS = {
    "ribbons": ribbons,
    "blobs": blobs,
    "dunes": dunes,
    "arches": arches,
    "columns": columns,
    "rays": rays,
    "stars": stars,
}

for index, (kind, build) in enumerate(KINDS.items()):
    scene = reset()
    build(random.Random(7 + index))

    # Grain is added by the page (.film2-grain); the render stays clean.

    scene.render.filepath = os.path.join(OUT, f"{kind}.png")
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {kind}")
