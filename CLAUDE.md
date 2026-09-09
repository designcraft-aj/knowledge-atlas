# Knowledge Atlas

A personal art atlas — a living data visualization of artists and their world.

## What this is
A Vite + vanilla JS single-page web app (no framework). It shows:
- A world map with artist portraits placed at their country of origin
- Portraits cluster tightly when multiple artists share a country
- A year slider — only artists alive in that year appear (with an "All eras" toggle)
- Hovering a portrait shows a detail card; clicking pins it open
- Zoom/pan (scroll, drag, and +/−/reset buttons) plus a magnifier lens (🔍)
- A custom gold dot cursor (mouse only; touch keeps the native cursor)

## File structure
    public/
      data/
        artists.json       ← artist entries
        authors.json       ← author entries
        philosophers.json  ← philosopher entries
        movements.json     ← art movement names + year ranges
      people-photos/       ← local portrait overrides (e.g. lao-tzu.jpg)
    src/
      main.js              ← entry point: loads data, wires everything together
      data.js              ← load + merge the per-type JSON files
      map.js               ← draw the world map (D3 geo, #zoom-layer group)
      portraits.js         ← place clustered portraits on the map
      country-coords.js    ← approximate country center coordinates
      controls.js          ← year slider, era label, type filters, timeline toggle
      card.js              ← hover/pin detail card
      images.js            ← runtime portrait + painting image fetching (cached)
      about.js             ← About panel + backdrop
      zoom.js              ← scroll/drag zoom + +/−/reset buttons
      loupe.js             ← magnifier lens that follows the cursor when toggled
      cursor.js            ← custom gold dot cursor
      util.js              ← shared helpers
      style.css            ← all CSS
    index.html             ← HTML shell
    CLAUDE.md              ← this file

## Rules — never break these
- Vanilla JS only, no JS framework
- D3 is installed via npm; import it in whichever module needs it
- Keep logic modular — one concern per file in src/, wired together in main.js
- People data lives in one file per type in /data/, merged at load; movements in /data/movements.json
- Portrait + painting images are fetched at runtime from Wikipedia and Wikimedia Commons, with local overrides in /people-photos
- Explain what each block of code does before writing it
- Do not proceed to the next step without my confirmation

## Visual design
- Core palette lives in CSS variables in `:root` (dark-roast coffee tones):
  `--bg` #1c130c, `--land` #2f2218, `--border` #443425, `--surface` #221810
- Portrait rings: #c4a25a (aged gold)
- Text: #e5ddd0 (warm off-white)
- Era label: large Georgia serif, opacity 0.035, centered ghost behind map
- Slider: 1px track, gold thumb with soft glow
- Cursor: gold dot that grows over clickable elements (mouse only)
- Magnifier lens + zoom buttons: gold ring/border, bottom-right controls stack
- Card paintings: sized to their own aspect ratio (no letterboxing), centered

## Clustering
Multiple artists from the same country cluster as tight small circles
around that country's approximate center coordinate.

## Current stage
Stage 2 — building the app. Stage 1 (data files) is complete. Core map,
clustering, slider, detail cards, image fetching, zoom/pan, magnifier lens,
and custom cursor are all in place; ongoing work is polish and new entries.
