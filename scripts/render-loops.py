"""
**The colour, moving, as a rendered loop.**

The reference does not animate a gradient: it renders a glossy form in coloured light, and the colour
moves because the light and the form move. This builds exactly that, small and short, so it can play
behind a card as a video loop:

  - a glossy ribbon form (a torus twisted into a flower) turning slowly
  - two coloured area lights that travel, so highlights bloom and slide across the surface
  - a lit backdrop plane whose colour shifts magenta to red
  - fog glow in the compositor for the bloom, and grain on top
  - shallow focus, so the far ribbon goes soft the way the reference's does

Output: public/wrapped-loops/<name>.webm, 80 frames, portrait.

    blender -b -P scripts/render-loops.py
"""

import math
import os

import bpy

OUT = os.path.join(os.getcwd(), "public", "wrapped-loops")
os.makedirs(OUT, exist_ok=True)

W, H, FRAMES, SAMPLES = 300, 650, 60, 12

SCENES = {
    # name: (surface grey, light a colour, light b colour, backdrop a, backdrop b)
    "magenta": (0.62, (1.0, 0.18, 0.62), (0.98, 0.32, 0.10), (1.0, 0.10, 0.55), (0.92, 0.06, 0.10)),
    "green": (0.55, (0.35, 1.0, 0.55), (0.05, 0.45, 0.30), (0.05, 0.35, 0.25), (0.02, 0.10, 0.08)),
    "blue": (0.6, (0.35, 0.72, 1.0), (0.55, 0.30, 1.0), (0.10, 0.28, 0.95), (0.02, 0.06, 0.22)),
    "amber": (0.65, (1.0, 0.75, 0.30), (1.0, 0.42, 0.10), (0.95, 0.62, 0.18), (0.55, 0.22, 0.05)),
}


def build(name, grey, light_a, light_b, back_a, back_b):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.frame_start = 1
    scene.frame_end = FRAMES
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "WEBM"
    scene.render.ffmpeg.codec = "WEBM"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = os.path.join(OUT, name)

    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.0, 0.03, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.2
    scene.world = world

    # Camera: portrait, slightly long so the form fills the frame.
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 55
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 9.0
    cam_data.dof.aperture_fstop = 1.4
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (0, -9, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # The lit backdrop: its colour is keyframed, which is the colour movement itself.
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 3, 0))
    back = bpy.context.object
    back.rotation_euler = (math.radians(90), 0, 0)
    mat = bpy.data.materials.new("back")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes["Principled BSDF"]
    for frame, colour in ((1, back_a), (FRAMES, back_b)):
        bsdf.inputs["Base Color"].default_value = (*colour, 1)
        bsdf.inputs["Emission Color"].default_value = (*colour, 1)
        bsdf.inputs["Emission Strength"].default_value = 1.0
        bsdf.inputs["Base Color"].keyframe_insert("default_value", frame=frame)
        bsdf.inputs["Emission Color"].keyframe_insert("default_value", frame=frame)
        bsdf.inputs["Emission Strength"].keyframe_insert("default_value", frame=frame)
    back.data.materials.append(mat)

    # The form: a torus twisted into a ribbon flower, glossy.
    bpy.ops.mesh.primitive_torus_add(major_radius=1.5, minor_radius=0.34,
                                    major_segments=256, minor_segments=48,
                                    location=(0, 0, 0), rotation=(math.radians(62), 0, 0))
    form = bpy.context.object
    twist = form.modifiers.new("twist", "SIMPLE_DEFORM")
    twist.deform_method = "TWIST"
    twist.angle = math.radians(560)
    bpy.ops.object.shade_smooth()

    glossy = bpy.data.materials.new("glossy")
    glossy.use_nodes = True
    gb = glossy.node_tree.nodes["Principled BSDF"]
    gb.inputs["Base Color"].default_value = (grey, grey, grey, 1)
    gb.inputs["Roughness"].default_value = 0.16
    gb.inputs["Metallic"].default_value = 0.35
    form.data.materials.append(glossy)

    for frame, angle in ((1, 0.0), (FRAMES, 2 * math.pi)):
        form.rotation_euler = (math.radians(62), math.radians(12) + angle * 0.25, angle)
        form.keyframe_insert("rotation_euler", frame=frame)

    # Two travelling coloured lights: this is what makes the colour move across the surface.
    for tag, colour, path in (("a", light_a, 1), ("b", light_b, -1)):
        data = bpy.data.lights.new(f"l{tag}", type="AREA")
        data.size = 3.2
        data.energy = 900
        data.color = colour
        lamp = bpy.data.objects.new(f"l{tag}", data)
        scene.collection.objects.link(lamp)
        for frame, (x, z) in ((1, (2.6 * path, 2.4)), (FRAMES, (-2.6 * path, -1.2))):
            lamp.location = (x, -2.5, z)
            lamp.rotation_euler = (math.radians(60), 0, math.radians(35 * path))
            lamp.keyframe_insert("location", frame=frame)
            lamp.keyframe_insert("rotation_euler", frame=frame)

    # Bloom and grain, so it reads as a print of light rather than as flat shading.
    scene.use_nodes = True
    tree = scene.node_tree
    for node in list(tree.nodes):
        tree.nodes.remove(node)
    layers = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.glare_type = "FOG_GLOW"
    glare.quality = "HIGH"
    glare.threshold = 0.35
    glare.size = 8
    comp = tree.nodes.new("CompositorNodeComposite")
    tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], comp.inputs[0])

    bpy.ops.render.render(animation=True)
    print(f"LOOP {name}")


for name, values in SCENES.items():
    build(name, *values)
