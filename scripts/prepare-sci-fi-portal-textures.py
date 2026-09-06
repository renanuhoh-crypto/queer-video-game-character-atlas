#!/usr/bin/env python3
"""Prepare web textures for the sci-fi portal Blender asset.

The source ZIP contains duplicate archive paths for the AO, roughness, and
metallic maps.  They must be addressed by central-directory entry index.
"""

from __future__ import annotations

import argparse
import io
import json
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image


TEXTURE_ENTRIES = {
    "portal_shell": {
        "base_color": 9,
        "normal": 12,
        "ao": 1,
        "roughness": 10,
        "metallic": 6,
    },
    "outer_box": {
        "base_color": 5,
        "normal": 14,
        "ao": 15,
        "roughness": 3,
        "metallic": 13,
    },
    "walkway": {
        "base_color": 7,
        "normal": 4,
        "ao": 11,
        "roughness": 8,
        "metallic": 16,
    },
}


def read_entry(archive: zipfile.ZipFile, index: int) -> Image.Image:
    entry = archive.infolist()[index]
    with archive.open(entry) as source:
        image = Image.open(io.BytesIO(source.read()))
        image.load()
    return image


def resize_rgb(image: Image.Image, size: int) -> Image.Image:
    return image.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)


def resize_normal(image: Image.Image, size: int) -> Image.Image:
    resized = resize_rgb(image, size)
    vectors = np.asarray(resized, dtype=np.float32) / 127.5 - 1.0
    lengths = np.linalg.norm(vectors, axis=2, keepdims=True)
    vectors /= np.maximum(lengths, 1.0e-6)
    encoded = np.clip((vectors * 0.5 + 0.5) * 255.0 + 0.5, 0, 255).astype(
        np.uint8
    )
    return Image.fromarray(encoded, mode="RGB")


def resize_scalar(image: Image.Image, size: int) -> Image.Image:
    return image.convert("L").resize((size, size), Image.Resampling.LANCZOS)


def save_webp(image: Image.Image, path: Path, *, lossless: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(
        path,
        format="WEBP",
        lossless=lossless,
        quality=88 if not lossless else 100,
        method=6,
        exact=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--color-size", type=int, default=2048)
    parser.add_argument("--normal-size", type=int, default=2048)
    parser.add_argument("--orm-size", type=int, default=1024)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict[str, object]] = {}

    with zipfile.ZipFile(args.archive) as archive:
        entries = archive.infolist()
        if len(entries) != 17:
            raise RuntimeError(f"Expected 17 ZIP entries, found {len(entries)}")

        for material, mapping in TEXTURE_ENTRIES.items():
            base = resize_rgb(read_entry(archive, mapping["base_color"]), args.color_size)
            normal = resize_normal(
                read_entry(archive, mapping["normal"]), args.normal_size
            )
            ao = resize_scalar(read_entry(archive, mapping["ao"]), args.orm_size)
            roughness = resize_scalar(
                read_entry(archive, mapping["roughness"]), args.orm_size
            )
            metallic = resize_scalar(
                read_entry(archive, mapping["metallic"]), args.orm_size
            )
            orm = Image.merge("RGB", (ao, roughness, metallic))

            outputs = {
                "base_color": args.output / f"{material}_basecolor.webp",
                "normal": args.output / f"{material}_normal.webp",
                "orm": args.output / f"{material}_orm.webp",
            }
            save_webp(base, outputs["base_color"], lossless=False)
            save_webp(normal, outputs["normal"], lossless=True)
            save_webp(orm, outputs["orm"], lossless=True)

            manifest[material] = {
                "source_entry_indices": mapping,
                "base_color": {
                    "path": outputs["base_color"].name,
                    "dimensions": [args.color_size, args.color_size],
                    "color_space": "sRGB",
                },
                "normal": {
                    "path": outputs["normal"].name,
                    "dimensions": [args.normal_size, args.normal_size],
                    "color_space": "linear",
                },
                "orm": {
                    "path": outputs["orm"].name,
                    "dimensions": [args.orm_size, args.orm_size],
                    "channels": {"r": "AO", "g": "roughness", "b": "metallic"},
                    "color_space": "linear",
                },
            }

    manifest_path = args.output / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    result = {
        "output": str(args.output.resolve()),
        "files": [
            {"name": path.name, "bytes": path.stat().st_size}
            for path in sorted(args.output.glob("*.webp"))
        ],
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
