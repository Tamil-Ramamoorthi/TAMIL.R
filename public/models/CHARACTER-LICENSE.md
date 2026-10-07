# character.glb — source and licence

`character.glb` is a converted, repackaged derivative of one avatar from the
Microsoft Rocketbox Avatar Library. The MIT licence requires the copyright
notice below to travel with any distribution, and this site is public, so this
file ships next to the model and must not be deleted.

| | |
| --- | --- |
| Model | `Business_Male_06` (internal mesh id `m025`) |
| Library | Microsoft Rocketbox Avatar Library |
| Author / copyright | © 2020 Microsoft Corporation |
| Source | https://github.com/microsoft/Microsoft-Rocketbox |
| Exact path in source | `Assets/Avatars/Professions/Business_Male_06/` |
| Licence | MIT |
| Attribution required | Yes — retain the copyright notice (below) |
| Commercial / portfolio use | Permitted without restriction |
| Retrieved | 2026-10-06 |

## Attribution notice

```
MIT License

Copyright (c) 2020 Microsoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## What was changed from the original

The upstream avatar ships as FBX plus loose 2048×2048 TGA maps, which no glTF
loader can read. The conversion was:

1. `Business_Male_06_facial.fbx` → glTF 2.0 with FBX2glTF 0.13.1 (Godot fork).
   The `_facial` variant was chosen over the plain one because it carries the
   blendshapes; the geometry and skeleton are identical in both.
2. Six TGA maps → JPEG. `*_color` became base colour, `*_normal` became the
   normal maps (both kept at 2048², 4:4:4 chroma so the normal vectors survive),
   and `*_specular` was inverted into the green channel of a 1024²
   metallic-roughness map, with metallic pinned to 0.
3. Morph targets pruned from 175 to the two the rig actually drives, renamed
   `eyeBlinkLeft` / `eyeBlinkRight` to match `BLINK_MORPHS`.
4. The baked `Take 001` morph-weight track was removed — the rig is driven
   procedurally.
5. Packed as a single self-contained `.glb`; no external file references.

Nothing in the mesh, UVs, skeleton or skin weights was altered.
