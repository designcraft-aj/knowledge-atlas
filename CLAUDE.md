# Knowledge Atlas

A personal art atlas — a living data visualization of artists and their world.

## What this is
A Vite + vanilla JS single-page web app (no framework). It shows:
- A world map with artist portraits placed at their country of origin
- Portraits cluster tightly when multiple artists share a country
- A year slider — only artists alive in that year appear (with an "All eras" toggle)
- Hovering a portrait shows a detail card; clicking pins it open

## File structure
    public/
      data/
        artists.json       ← artist entries
        authors.json       ← author entries
        philosophers.json  ← philosopher entries
        movements.json     ← art movement names + year ranges
      people-photos/       ← local portrait overrides (e.g. lao-tzu.jpg)
    src/
      main.js              ← all JavaScript
      style.css            ← all CSS
    index.html             ← entry point
    CLAUDE.md              ← this file

## Rules — never break these
- Vanilla JS only, no JS framework
- D3 is installed via npm, import it in main.js
- People data lives in one file per type in /data/, merged at load; movements in /data/movements.json
- Portrait + painting images are fetched at runtime from Wikipedia and Wikimedia Commons, with local overrides in /people-photos
- Explain what each block of code does before writing it
- Do not proceed to the next step without my confirmation

## Visual design
- Background: #0d0c0a
- Land masses: #19170f, borders: #2c2920
- Portrait rings: #c4a25a (aged gold)
- Text: #e5ddd0 (warm off-white)
- Era label: large Georgia serif, opacity 0.035, centered ghost behind map
- Slider: 1px track, gold thumb with soft glow

## Clustering
Multiple artists from the same country cluster as tight small circles
around that country's approximate center coordinate.

## Current stage
Stage 2 — building the app. Stage 1 (data files) is complete.
