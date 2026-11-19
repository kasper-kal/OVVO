"""
**Backdrop plates, rendered in Blender.**

The reference's backdrops are lit objects, not flat polygons: soft edges catching a light, blocks that
overlap with real shadows, a gentle fall-off where a shape leaves the frame. That is what a renderer
gives and what hand-written SVG cannot.

This script builds one small scene per kind of card — blades, wedges, collage, bars, arches, rays,
horizon — lights it with a big soft area light over a white world, and renders it portrait at phone
proportions. The plates are deliberately **grey on white**, so the page can multiply the plate into
each chapter's own colour: one render serves every card, and a card's backdrop always matches the
card's field.

Run:  blender -b -P scripts/render-backdrops.py
Out:  public/wrapped-scenes/<kind>.png
"""

import bpy
import math
import os
import random

OUT = os.path.join(os.getcwd(), "public", "wrapped-scenes")
os.makedirs(OUT, exist_ok=True)

W, H = 600, 1300          # phone proportions at two times the size it is shown
SAMPLES = 28


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = False
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"

    world = bpy.data.worlds.new("ovvo-world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (1, 1, 1, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
    scene.world = world

    # Orthographic, straight on: the plate has to sit behind a flat card, not be a photograph of a set.
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 2.0
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (0, -10, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # One big soft light from the upper right, so every shape falls off toward its far edge.
    light_data = bpy.data.lights.new("key", type="AREA")
    light_data.size = 6.0
    light_data.energy = 260
    light = bpy.data.objects.new("key", light_data)
    light.location = (2.6, -3.2, 2.4)
    light.rotation_euler = (math.radians(52), 0, math.radians(38))
    scene.collection.objects.link(light)

    return scene


def slab(name, x, y, z, sx, sy, sz, tilt=0.0, grey=0.52):
    """A beveled block. The bevel is what makes an edge read as lit rather than drawn."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (sx, sy, sz)
    obj.rotation_euler = (0, math.radians(tilt), 0)

    mat = bpy.data.materials.new(f"m-{name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (grey, grey, grey, 1)
    bsdf.inputs["Roughness"].default_value = 0.62
    obj.data.materials.append(mat)

    bev = obj.modifiers.new("bevel", "BEVEL")
    bev.width = 0.012
    bev.segments = 3
    return obj


def blades(rng):
    """Layered ribbons cut off the top-right and bottom-left corners."""
    for i in range(6):
        near = 0.15 + i * 0.13
        depth = 0.55 - i * 0.07
        slab(f"blade{i}", 0.75 - i * 0.06, 0.1 + i * 0.05, 0.92 - i * 0.11,
             1.5, 0.12, 0.09, tilt=-18 - i * 2, grey=0.32 + i * 0.07)
    for i in range(3):
        slab(f"bladeb{i}", -0.7 + i * 0.07, 0.1 - i * 0.04, -0.86 + i * 0.09,
             1.2, 0.12, 0.08, tilt=14 + i * 2, grey=0.38 + i * 0.06)


def wedges(rng):
    """Stacked wedges peeking out of two corners."""
    for i in range(4):
        slab(f"wedge{i}", -0.95 + i * 0.06, 0.1, -0.95 + i * 0.13,
             0.55 + i * 0.1, 0.14, 0.42 + i * 0.1, tilt=32 + i * 3, grey=0.3 + i * 0.09)
    for i in range(3):
        slab(f"wedgeb{i}", 0.95 - i * 0.05, 0.1, 0.9 - i * 0.1,
             0.45 + i * 0.09, 0.14, 0.34 + i * 0.09, tilt=-28 - i * 3, grey=0.36 + i * 0.07)


def collage(rng):
    """A torn collage: blocks of different sizes overlapping in one half."""
    for i in range(7):
        slab(f"col{i}", -0.55 + rng.uniform(-0.35, 0.45), 0.1 + i * 0.02,
             -0.15 + rng.uniform(-0.5, 0.55), rng.uniform(0.25, 0.6), 0.16,
             rng.uniform(0.2, 0.5), tilt=rng.uniform(-24, 24), grey=rng.uniform(0.25, 0.72))


def bars(rng):
    """Columns rising from the floor at different heights."""
    for i in range(11):
        h = rng.uniform(0.25, 0.95)
        slab(f"bar{i}", -0.95 + i * 0.19, 0.1, -1.0 + h / 2, 0.16, 0.16, h, grey=rng.uniform(0.3, 0.75))


def arches(rng):
    """Nested arches standing on the floor."""
    for i in range(4):
        w = 0.9 - i * 0.16
        h = 0.5 + i * 0.18
        slab(f"arch{i}", 0, 0.1 + i * 0.05, -1.0 + h / 2, w, 0.18, h, grey=0.3 + i * 0.1)


def rays(rng):
    """Wedge-shaped rays fanning from the bottom right."""
    for i in range(6):
        ang = 8 + i * 15
        slab(f"ray{i}", -0.2 - i * 0.05, 0.1 + i * 0.03, -0.5 + i * 0.16,
             1.6, 0.12, 0.07, tilt=ang, grey=0.3 + i * 0.08)


def horizon(rng):
    """Two long low ridges and a floor — for the cards about ground."""
    slab("ridge-far", 0, 0.2, -0.35, 3.0, 0.2, 0.34, tilt=2, grey=0.62)
    slab("ridge-near", 0.15, 0.1, -0.62, 2.6, 0.22, 0.42, tilt=-3, grey=0.42)
    slab("floor", 0, 0, -1.05, 3.2, 0.3, 0.5, grey=0.3)


KINDS = {
    "blades": blades,
    "wedges": wedges,
    "collage": collage,
    "bars": bars,
    "arches": arches,
    "rays": rays,
    "horizon": horizon,
}

for index, (kind, build) in enumerate(KINDS.items()):
    scene = reset()
    build(random.Random(41 + index))
    scene.render.filepath = os.path.join(OUT, f"{kind}.png")
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {kind}")
