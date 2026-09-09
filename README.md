# Knowledge Atlas

A living personal database of artists, authors, and philosophers I discover.
Built to see them on a map, understand when they existed, and 
collect the ideas that stayed with me.

## What it does
- World map with portraits placed at each person's country of origin
- Three categories — artists, authors, philosophers — each toggleable
- Year slider — only people alive in the selected year appear on the map
- "All eras" toggle to drop the time filter and see everyone at once
- Era labels that shift as you move through time
- People from the same country cluster together on the map
- Hover a portrait for a detail card; click to pin it open
- Portraits are real photos pulled from Wikipedia, with initials as a fallback

## Stack
Vite, vanilla JS, D3.js. Data lives in two JSON files. No framework, no database.

## Running locally
```bash
npm install
npm run dev
```

## Adding a new person
People live in one file per type under `public/data/` — `artists.json`,
`authors.json`, `philosophers.json` — all merged onto the same map at load.
Open the file for the type you're adding and append an entry. The shared
fields are:

```json
{
  "id": "firstname-lastname",
  "name": "Full Name",
  "type": "artist",
  "born": 1820,
  "died": 1910,
  "country": "France",
  "wikipedia": "Wikipedia_Page_Name",
  "movement": "Impressionism"
}
```

`type` is one of `artist`, `author`, or `philosopher`, and each carries its
own personal detail field(s) for the card:

- **artist** — `"favourite_painting": "Title of Work"`
- **author** — `"books_read": ["Title", "Title"]`, `"quote": "A line that stayed with me"`
- **philosopher** — `"quote": "A line that stayed with me"` (school of thought reuses `movement`)

`portrait` images are fetched automatically from the `wikipedia` page title —
no need to add them by hand.

## Credits
**Built with [Claude Code](https://claude.ai/code) by Anthropic** —
used throughout for code generation, iteration, and debugging.

**Data sourced from [Wikipedia](https://wikipedia.org)** via the 
Wikipedia REST API and Wikidata. All artist information, 
biographical data, and portrait images are attributed to their 
respective Wikipedia contributors under CC BY-SA 4.0.

## License
Code: MIT
Data (public/data/): CC BY-NC 4.0

## Scope
This is a personal project, not a product. Data is manually curated
and Wikipedia-enriched. Portrait images and the detail card are built;
next up is a search bar to find and add people directly from Wikidata.

## Live
[atlas.anushreejoshi.com](https://atlas.anushreejoshi.com)