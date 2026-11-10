# Atom

One core, six orbits. The atom is the whole page: the camera travels into and around it,
and every fact sits on the orbit it belongs to.

## Research note

| Reference                                                                   | What I took                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Igloo Inc** (abeto, Awwwards Site of the Year 2024)                       | One object carries the site. Scroll drives a camera through it; the UI is a thin, monospaced instrument layer on top. The jury praised immersive 3D with _easy_ scroll navigation, so scroll stays the primary input here. |
| **Lusion** (own site, Site of the Month case study)                         | Camera placement authored as data per shot, plus a small cursor-driven camera tilt so the scene feels alive without stealing control. Here: keyframes in `data.ts`, ±2.5° pointer parallax.                                |
| **Lusion, Aether 1** (Codrops, 2025)                                        | "Faux depth of field" as a performance tactic. Here: lines and dust fade or open into discs by distance from the focal plane in the shader. No post chain.                                                                 |
| **KAI Design Dept.** (Codrops, 2025)                                        | Line-based scenes with blur used to separate planes of depth, not to glow. Same reasoning for the orbit DOF.                                                                                                               |
| **Active Theory** (Halo 5 visualizer, _Craft Matters_)                      | Keep text in the DOM, positioned over the 3D scene, so it stays sharp; and "WebGL as decoration becomes noise". Every label here is projected DOM and every 3D element carries a fact or a measurement.                    |
| **Bruno Simon** (folio 2025)                                                | Navigation is physical: you push the world around. Here: drag orbits the camera (it springs back after a pause), arrow keys orbit and step chapters.                                                                       |
| **Codrops: cinematic 3D scroll with GSAP / Blender camera paths** (2025–26) | Chapters as camera _shots_ separated by scroll distance, with holds where text reads. Here: each chapter holds still for its first 30% of scroll, then travels on one cubic in-out curve.                                  |
| **Teenage Engineering** (site and product UI)                               | Instrument restraint: monochrome, one accent, mono labels, 1px rules, numbers as the decoration. The HUD (index, rail, camera readout, coordinates) follows this.                                                          |
| **three.js manual, "Aligning HTML Elements to 3D"**                         | Projection of anchors per frame, plus occlusion tests against the core so labels behind it hide.                                                                                                                           |

## Shots (scroll, ↑ ↓, chapter index, or the mobile buttons)

| #   | Chapter          | Camera move                                                                                          |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| 00  | Ident            | Establishing 3/4 shot, atom right of frame, name left. Dolly-in on load.                             |
| 01  | AI systems       | **Dive** into the nucleus. The 80 core faces pull apart and show the die (SAIF readout on the core). |
| 02  | Software         | **Slide** along the second orbit, close and low, target pulled onto the ring.                        |
| 03  | Mechanics        | **Orbit** ~90° around and up.                                                                        |
| 04  | Electronics      | **Drop** through the shells to look up from below the ring plane.                                    |
| 05  | Robotics         | **Pull out** to a long-lens wide shot (FOV 30).                                                      |
| 06  | TSIG · Education | **Rise** to a plan view; the polar grid comes up.                                                    |
| 07  | Contact          | **Return** to the core.                                                                              |

Ring chapters define their camera in the ring's own frame (`frame: 'ring'`), so each shot reads
the orbit the same way whatever its tilt, and stations fan across the arc nearest the camera
(`rig.ts`). Drag or ← → adds a yaw/pitch offset that springs back.

## System

- **Palette:** `#0a0b0c` void, `#e9e7e2` ink, two greys, and one accent, international orange
  `#ff5b1f`, used only for the thing in focus (active stations, lead packets, the hot block on the
  die, index marker). No bloom, no gradients, no glow sprites. Light comes from a room
  environment map on metal facets and two directional lights.
- **Type:** Hubot Sans (display) + Martian Mono (readouts). Hubot Sans is GitHub's mechanical
  sibling of Mona Sans; its width axis (75–125) does the work: wide and light for names and
  titles, condensed for numbers. Martian Mono was drawn for interfaces and holds up at 9–11px.
  Neither is on the banned list, and neither reads as sci-fi costume.
- **Motion:** one cubic family. `--io` `cubic-bezier(.65,0,.35,1)` matches the camera's cubic
  in-out; `--out` `cubic-bezier(.33,1,.68,1)` for reveals. Staggered label reveals (70ms steps),
  exponential damping on the camera, no springs except the drag return.
- **Reduced motion:** camera cuts between shots instead of travelling, packets stop, no intro,
  no parallax, CSS transitions near zero.
- **Mobile:** portrait screens widen the lens (keeps ~72% of the horizontal span) and shift it up
  so the atom sits above a numbered readout sheet; stations show as numbers on the ring.
  Vertical swipe scrolls, horizontal drag orbits. DPR capped at 1.5, dust halved.

## Buddy and eggs

- **Bit**, a data packet with eyes, rides the progress rail, watches the cursor (or the core),
  and drops hints when idle. Click it.
- Type **ib**, or click the core seven times: exploded view. The 80 faces fly out, the rings
  unlock and spin, then everything reassembles.

## Files

`data.ts` content and keyframes · `rig.ts` ring geometry and world-space cameras ·
`Scene.tsx` WebGL · `AtomApp.tsx` HUD, scroll and input · `Buddy.tsx` · `shaders.ts` ·
`store.ts` shared per-frame state.
