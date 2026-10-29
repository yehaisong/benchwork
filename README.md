# Benchwork: 3D shop planner

A parametric, CAD-style planner for small shop builds: footrests, mudroom storage, work tables and a VEX robotics practice field. Change a few sliders and get a 3D model, a cut list, step-by-step build instructions and a shopping list with prices.

It runs entirely in the browser: no build step, no server, no account.

## Run it

Open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Projects

| Project | What it is |
|---|---|
| Sloped footrest | Plywood footrest with an adjustable tilt |
| 2x3 frame with shelf | 2x3 stand with a top board and a middle board; optional sloped top laid out as a rise-over-run ratio so it can be cut with a hand saw |
| Flip box (three heights) | Plywood box that gives three heights depending on which face it rests on |
| Desk riser shelf | Monitor or laptop riser |
| Mudroom locker | 2–4 bays with bench, one or two shoe shelves, hooks and a cubby |
| Mudroom bench, hooks and shelf | Freestanding 2x3 bench plus a hook board and a shelf on the wall |
| Corner work table | 2x4 frame table for a room corner, with four legs or with wall ledgers and front legs |
| Wall-hung corner table (one leg) | Ledgers on both walls and a single leg, plus an optional half-depth middle shelf |
| VEX V5 practice field | Half or full field with 1x12 walls in sections that come apart, optionally on a raised platform up to 40" |

All cuts are square crosscuts or simple angled cuts that can be made with a hand saw.

## Features

- **3D view**: orbit, pan and zoom (mouse, wheel, touch pinch), click a part to see its size, explode slider, dimension lines, and context (table and stool, a wall, or a room corner).
- **Design**: sliders and choices for every project, with warnings when a setting won't work.
- **Fit to me**: works out stool and footrest heights from your body measurements.
- **Cut list**: every part with its size, grouped, plus how many 8 ft boards and 4×8 sheets to buy, worked out by fitting the cuts.
- **Build**: numbered steps; tap one to see that step in the model, with its parts highlighted.
- **Materials**: shopping list with screws, hardware, glue and finish, editable prices and a total.
- **Saved designs**: save named versions of a project, load or update them, and export or import them as a JSON file.
- **Inches or centimetres**, and light or dark theme following your system.

Settings and saved designs are stored in your browser's local storage. Use **Export all** to keep a backup.

## Accuracy

Dimensions, lumber counts and prices are planning estimates. Measure your own materials and space before cutting. For the VEX field, check the current game manual and official field drawings for the exact perimeter size. Anything fixed to a wall must go into studs or proper masonry anchors.

## Files

- `index.html`: page layout (header, side panel, 3D viewport). Loads three.js r128 from cdnjs.
- `styles.css`: design tokens (light and dark themes) and layout.
- `app.js`: everything else.

## How app.js is organized

- **Formatting**: inch fractions (to 1/16") and cm display; `toDisp` / `fromDisp` convert slider values.
- **TEMPLATES**: one entry per project. Each has `params` (sliders and selects), `build(p)` returning `{parts, warns, t, summary, rot?}`, `steps(p)` for build instructions, and `stages` (or `stages(p)`) linking each step to the parts it cuts or adds.
- **Parts**: `box` (`size`, `pos`, optional `rotX`), `trap` (trapezoid side) or `prof` (a side profile extruded along x, used for bevelled parts). Each part has a `cut` entry `{L, W, note}`, plus `stock` for lumber (`2x3`, `2x4`, `1x12`) or `hw` for bought hardware.
- **State**: saved to localStorage under `benchwork.v1`. All dimensions are stored in inches.
- **Materials**: `packSheets` fits sheet parts into ripped strips of 4×8 sheets; `sticks` fits lumber cuts into 8 ft boards.

## Adding a project

Add a new key to `TEMPLATES` with `name`, `context` (`'floor'`, `'table'`, `'wall'`, `'corner'` or `'none'`), `fitKind` (`'height'`, `'flip'`, or `null`), `params`, `build`, `steps` and `stages`. It appears in the project dropdown automatically.

## Ideas for next steps

- Sheet layout diagram for the cut list
- Export to SVG, DXF or STL
- Joinery options (pocket screws, dados) reflected in part sizes

## License

MIT. See [LICENSE](LICENSE).
