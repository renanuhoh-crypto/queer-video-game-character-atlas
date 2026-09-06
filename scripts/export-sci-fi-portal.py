"""Export the exact sci-fi portal meshes as a web-ready GLB.

Run with Blender, for example:
  blender --background --python scripts/export-sci-fi-portal.py -- \
    --input portal_bundle.blend --textures optimized --output sci-fi-portal.glb
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy


EXPECTED_OBJECTS = {"clamps", "portal_main", "side_housing", "walkway"}
MATERIAL_BY_OBJECT = {
    "clamps": "portal_shell",
    "portal_main": "portal_shell",
    "side_housing": "outer_box",
    "walkway": "walkway",
}


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--textures", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args(argv)


def load_image(path: Path, name: str, color_space: str) -> bpy.types.Image:
    image = bpy.data.images.load(str(path.resolve()), check_existing=False)
    image.name = name
    image.colorspace_settings.name = color_space
    return image


def gltf_occlusion_group() -> bpy.types.NodeTree:
    existing = bpy.data.node_groups.get("glTF Material Output")
    if existing is not None:
        return existing
    group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    group.interface.new_socket(
        name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat"
    )
    return group


def build_material(name: str, texture_dir: Path) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (0.18, 0.2, 0.23, 1.0)

    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (700, 0)
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    principled.location = (420, 0)
    principled.inputs["Metallic"].default_value = 1.0
    principled.inputs["Roughness"].default_value = 1.0
    links.new(principled.outputs["BSDF"], output.inputs["Surface"])

    base_node = nodes.new("ShaderNodeTexImage")
    base_node.name = f"{name}_basecolor"
    base_node.label = "Base Color (sRGB)"
    base_node.location = (-650, 260)
    base_node.image = load_image(
        texture_dir / f"{name}_basecolor.webp", f"{name}_basecolor", "sRGB"
    )
    links.new(base_node.outputs["Color"], principled.inputs["Base Color"])

    orm_node = nodes.new("ShaderNodeTexImage")
    orm_node.name = f"{name}_orm"
    orm_node.label = "ORM: R=AO G=Roughness B=Metallic"
    orm_node.location = (-650, -40)
    orm_node.image = load_image(
        texture_dir / f"{name}_orm.webp", f"{name}_orm", "Non-Color"
    )
    separate = nodes.new("ShaderNodeSeparateColor")
    separate.mode = "RGB"
    separate.location = (-360, -40)
    links.new(orm_node.outputs["Color"], separate.inputs["Color"])
    links.new(separate.outputs["Green"], principled.inputs["Roughness"])
    links.new(separate.outputs["Blue"], principled.inputs["Metallic"])

    occlusion = nodes.new("ShaderNodeGroup")
    occlusion.name = "glTF Material Output"
    occlusion.label = "glTF Occlusion"
    occlusion.location = (0, -250)
    occlusion.node_tree = gltf_occlusion_group()
    links.new(separate.outputs["Red"], occlusion.inputs["Occlusion"])

    normal_node = nodes.new("ShaderNodeTexImage")
    normal_node.name = f"{name}_normal"
    normal_node.label = "Normal (linear)"
    normal_node.location = (-650, -390)
    normal_node.image = load_image(
        texture_dir / f"{name}_normal.webp", f"{name}_normal", "Non-Color"
    )
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.location = (-30, -390)
    links.new(normal_node.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], principled.inputs["Normal"])

    return material


def triangle_count(mesh: bpy.types.Mesh) -> int:
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def main() -> None:
    args = parse_args()
    bpy.ops.wm.open_mainfile(filepath=str(args.input.resolve()))

    scene_objects = {obj.name for obj in bpy.context.scene.objects if obj.type == "MESH"}
    if scene_objects != EXPECTED_OBJECTS:
        raise RuntimeError(
            f"Expected exactly {sorted(EXPECTED_OBJECTS)}, found {sorted(scene_objects)}"
        )

    materials = {
        name: build_material(name, args.textures)
        for name in sorted(set(MATERIAL_BY_OBJECT.values()))
    }

    for object_name, material_name in MATERIAL_BY_OBJECT.items():
        obj = bpy.data.objects[object_name]
        obj.data.name = object_name
        obj.data.materials.clear()
        obj.data.materials.append(materials[material_name])

    housing = bpy.data.objects["side_housing"]
    mirror = housing.modifiers.get("Mirror")
    if mirror is None or mirror.type != "MIRROR":
        raise RuntimeError("side_housing is missing its expected Mirror modifier")
    bpy.context.view_layer.objects.active = housing
    housing.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mirror.name)

    bpy.ops.object.select_all(action="DESELECT")
    for name in EXPECTED_OBJECTS:
        bpy.data.objects[name].select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects["portal_main"]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(args.output.resolve()),
        export_format="GLB",
        use_selection=True,
        export_image_format="AUTO",
        export_image_quality=88,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_yup=True,
        export_apply=False,
        export_unused_images=False,
        export_unused_textures=False,
        will_save_settings=False,
    )

    exported_stats = {
        name: {
            "vertices": len(bpy.data.objects[name].data.vertices),
            "triangles": triangle_count(bpy.data.objects[name].data),
            "material": bpy.data.objects[name].data.materials[0].name,
        }
        for name in sorted(EXPECTED_OBJECTS)
    }

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(args.output.resolve()))
    imported = {obj.name: obj for obj in bpy.context.scene.objects if obj.type == "MESH"}
    if set(imported) != EXPECTED_OBJECTS:
        raise RuntimeError(
            f"Round-trip names differ: expected {sorted(EXPECTED_OBJECTS)}, "
            f"found {sorted(imported)}"
        )

    round_trip = {
        name: {
            "vertices": len(imported[name].data.vertices),
            "triangles": triangle_count(imported[name].data),
            "materials": [material.name for material in imported[name].data.materials],
        }
        for name in sorted(imported)
    }
    summary = {
        "output": str(args.output.resolve()),
        "bytes": args.output.stat().st_size,
        "exported": exported_stats,
        "round_trip": round_trip,
        "total_triangles": sum(item["triangles"] for item in round_trip.values()),
    }
    print("SCI_FI_PORTAL_EXPORT " + json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
