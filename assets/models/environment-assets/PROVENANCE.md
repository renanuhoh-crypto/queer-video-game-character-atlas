# Environment asset provenance

These assets were supplied directly by the project owner on 2026-09-06 and prepared for local prototyping.

## Web derivatives currently used

- `public/models/cybercity/cybercity-2099.fbx` and resized textures derive from `cybercity-2099-v2.zip`.
- `public/models/rainbow-road/spaceway-track.glb` derives from the geometry in `boom-karts-spaceway.zip`. Embedded/external textures, imported lights, branded billboards, and unused scene content were omitted. Materials were replaced with original Press Q runtime materials.
- `public/models/environment/cyberpunk-laptop.glb` derives from `cyberpunk-laptop-concept-design.zip`. The 4K texture set was omitted and replaced with lightweight Press Q materials.
- `public/models/environment/portal-button.glb` derives from `button-from-portal-2-original.zip`. Textures and the imported camera were omitted and the geometry was flattened for the web.

## Source-package checksums

- Cyber City 2099: `03E52B21262A536989AC3893FC60524AF77522E114539D36CE24A89642DB1937`
- Boom Karts Spaceway: `959FF98B20F190D6DAF23447EF414605B8B035F5C7B9E5EEBD59D041AFAAAC12`
- Cyberpunk laptop: `FD5F68B3ADB2399908E3D9525990C215C321B47D8DC20A2984A4B03635EEF815`
- Portal button: `51FD4099557D8BF50E7F09F7F91C792CEAE0F1CA9BC61BE2154D65288EEF7328`
- Twin Flame: `A373E5CF7673D92B76C306E220C25A6ADFF8A4980932A5EEC380410ECDFF8ECC`
- Sci-fi portal gateway (both supplied ZIP copies are identical): `1D77DD8ACB151E3B7869C1687D593E6FB349EABEB52AB8F0D87FE77FF957434B`

## Publication status

None of the supplied archives includes a README, license, or attribution document. The portal-button source also contains a `Portal 2` fan-project reference, while the Spaceway source contains third-party branding. Confirm ownership and redistribution rights before publishing these derivatives or committing them to a public repository.

The Twin Flame and large sci-fi gateway `.blend` files are not shipped in the site. They require a licensed source confirmation plus an offline Blender cleanup/export pass before production use. The current twin-flame beacon and animated portal energy are original procedural Three.js elements, not copies of those meshes.
