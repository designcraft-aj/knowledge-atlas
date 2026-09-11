// All runtime image fetching lives here: portrait photos and painting images
// from Wikipedia + Wikimedia Commons, with localStorage caching. Nothing here
// imports d3 — the functions operate on the portrait selection passed in.

// Fetch a portrait photo for each person from the Wikipedia REST summary API
// (keyed by their `wikipedia` page title), clip it into the ring, and hide the
// initials once it loads. Resolved URLs — including "no image" — are cached in
// localStorage so repeat visits don't re-fetch. People without a photo keep
// their initials.
export async function loadPortraitImages(portrait) {
  const nodes = portrait.data();
  const CACHE_KEY = "ka-portrait-images";
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {}

  // Swap in a photo for one person: show the image, hide their initials.
  // Stash the URL on the node so the Artworks view can restore it on toggle.
  function apply(d, src) {
    d.photo = src;
    const sel = portrait.filter((n) => n === d);
    sel.select("image.portrait-photo").attr("href", src).style("display", null);
    sel.select("text.portrait-initials").style("display", "none");
  }

  await Promise.all(
    nodes.map(async (d) => {
      // A hand-added local photo always wins over the Wikipedia lookup.
      if (d.image) {
        apply(d, d.image);
        return;
      }
      if (!d.wikipedia) return;

      // Cache hit — a stored URL, or null meaning "known to have no photo".
      if (d.wikipedia in cache) {
        if (cache[d.wikipedia]) apply(d, cache[d.wikipedia]);
        return;
      }

      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(d.wikipedia)}`
        );
        if (!res.ok) {
          cache[d.wikipedia] = null;
          return;
        }
        const data = await res.json();
        const src = data.thumbnail?.source || null;
        cache[d.wikipedia] = src;
        if (src) apply(d, src);
      } catch {
        // Network error: leave initials, and don't cache a transient failure.
      }
    })
  );

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// Warm the browser cache so paintings appear instantly when a card opens.
// no-referrer matches the <img> in the card so hotlink-protected hosts (e.g.
// the Art Institute of Chicago) serve the same request instead of a 403.
function preload(url) {
  if (!url) return;
  const im = new Image();
  im.referrerPolicy = "no-referrer";
  im.src = url;
}

// Name particles that shouldn't count as identifying tokens when matching a
// filename to an artist (e.g. "van" in "Rembrandt van Rijn").
const NAME_PARTICLES = new Set([
  "van", "von", "de", "del", "della", "di", "da", "la", "le", "der", "den",
]);

// Split an artist's name into meaningful lowercase tokens for matching.
function nameTokens(name) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !NAME_PARTICLES.has(w));
}

// Search Wikimedia Commons (File namespace) for a painting and return a
// ~640px thumbnail. The top search hit is often a same-titled work by another
// artist, so we pull several candidates and prefer the file whose name matches
// the artist, keeping search rank as the tie-breaker.
async function commonsPaintingThumb(painting, artist) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    "&generator=search&gsrnamespace=6&gsrlimit=8" +
    `&gsrsearch=${encodeURIComponent(`${painting} ${artist}`)}` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=640";
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const tokens = nameTokens(artist);
  const candidates = Object.values(pages).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0) // preserve Commons' relevance order
  );

  // Score each by how many artist tokens appear in its filename; the best
  // score wins, ties broken by the (already-sorted) search rank.
  let best = candidates[0];
  let bestScore = -1;
  for (const p of candidates) {
    const title = (p.title || "").toLowerCase();
    const score = tokens.reduce((n, t) => n + (title.includes(t) ? 1 : 0), 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }

  const info = best?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

// A Wikipedia article's lead image for an exact title — the fallback source.
async function wikipediaLeadThumb(title) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.thumbnail?.source || null;
}

// For each artist, resolve their favourite painting to an image and stash the
// URL on the node (d.paintingImage) for the detail card. Order: manual
// override → Commons (artist-disambiguated) → Wikipedia article. Results are
// cached per id|title so changing a favourite triggers a fresh lookup.
export async function loadPaintingImages(portrait) {
  const nodes = portrait
    .data()
    .filter((d) => d.type === "artist" && d.favourite_painting);
  const CACHE_KEY = "ka-painting-images-v2";
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {}

  await Promise.all(
    nodes.map(async (d) => {
      // Manual override always wins, and isn't cached.
      if (d.painting_image) {
        d.paintingImage = d.painting_image;
        preload(d.paintingImage);
        return;
      }

      const key = `${d.id}|${d.favourite_painting}`;
      if (key in cache) {
        d.paintingImage = cache[key] || null;
        preload(d.paintingImage);
        return;
      }

      try {
        let src = await commonsPaintingThumb(d.favourite_painting, d.name);
        if (!src) {
          // Fall back to the painting's own article, minus any "(qualifier)".
          const clean = d.favourite_painting.replace(/\s*\([^)]*\)\s*$/, "").trim();
          src = await wikipediaLeadThumb(clean);
        }
        cache[key] = src; // definitive result (found or genuinely not found)
        d.paintingImage = src;
        preload(src);
      } catch {
        // Transient network error — leave unresolved so it retries next load.
      }
    })
  );

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}
