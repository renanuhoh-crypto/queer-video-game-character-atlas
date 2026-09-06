# Coral Piece source note

- Source archive: `coral-piece.zip`
- Source model: `source/coral fbx finished.fbx` (Autodesk FBX 7.5 binary, Maya 2018)
- Geometry: two meshes, 7,399 triangles total; no animation tracks
- Orientation: Y-up, +Z front; source scale retained 1:1
- Web normalization: centered in X/Z, with the lowest source vertex placed at Y=0
- Textures: four source PNGs are embedded in the GLB. The uniformly black metallic map is represented exactly by `metallicFactor: 0`.

## License status

The supplied archive does **not** contain a license, attribution file, author name, or source URL. Confirm publication and redistribution rights with the asset provider before shipping this model publicly.

Run the reproducible conversion from the repository root with:

```sh
node scripts/prepare-coral-piece.mjs /path/to/coral-piece.zip
```

The pipeline creates `coral-piece.glb` and `coral-piece.stats.json` in this directory.
