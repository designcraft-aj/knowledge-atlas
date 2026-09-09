import "./style.css";
import * as d3 from "d3";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";

// Approximate geographic center [longitude, latitude] of each country.
// The projection turns these into x/y pixels. Any country not listed here
// falls back to a live Wikidata coordinate lookup at search time.
const COUNTRY_COORDS = {
  // Western Europe
  Netherlands: [5.3, 52.2],
  France: [2.5, 46.8],
  Belgium: [4.5, 50.6],
  Germany: [10.4, 51.2],
  Switzerland: [8.2, 46.8],
  Austria: [14.5, 47.6],
  "United Kingdom": [-1.8, 52.8],
  Ireland: [-8.0, 53.2],
  Spain: [-3.7, 40.2],
  Portugal: [-8.0, 39.5],
  Italy: [12.5, 42.5],
  Greece: [23.7, 38.0],
  // Northern Europe
  Norway: [9.5, 61.5],
  Sweden: [15.0, 62.0],
  Denmark: [9.5, 56.0],
  Finland: [26.0, 64.0],
  Iceland: [-18.5, 64.9],
  // Central & Eastern Europe
  Poland: [19.1, 52.1],
  "Czech Republic": [15.5, 49.8],
  Hungary: [19.5, 47.2],
  Romania: [25.0, 45.9],
  Bulgaria: [25.5, 42.7],
  Croatia: [15.5, 45.1],
  Serbia: [21.0, 44.0],
  Ukraine: [31.0, 49.0],
  Russia: [37.6, 55.7],
  Lithuania: [24.0, 55.2],
  Latvia: [24.9, 56.9],
  Estonia: [25.5, 58.7],
  // Middle East & West Asia
  Turkey: [35.0, 39.0],
  Iran: [53.0, 32.5],
  Iraq: [43.7, 33.0],
  Israel: [35.0, 31.4],
  Lebanon: [35.9, 33.9],
  "Saudi Arabia": [45.0, 24.0],
  Armenia: [45.0, 40.3],
  // South & Southeast Asia
  India: [79.0, 22.0],
  Pakistan: [70.0, 30.0],
  Bangladesh: [90.3, 23.7],
  Nepal: [84.1, 28.4],
  "Sri Lanka": [80.7, 7.9],
  Afghanistan: [66.0, 33.9],
  Vietnam: [106.0, 16.0],
  Thailand: [101.0, 15.0],
  Indonesia: [113.0, -2.5],
  Philippines: [122.0, 12.0],
  // East Asia
  China: [104.0, 35.0],
  Japan: [138.0, 36.5],
  "South Korea": [127.8, 36.5],
  // Africa
  Egypt: [30.0, 26.8],
  Morocco: [-6.0, 31.8],
  Algeria: [2.6, 28.0],
  Tunisia: [9.5, 34.0],
  Nigeria: [8.0, 9.6],
  "South Africa": [24.0, -29.0],
  Ethiopia: [39.6, 8.6],
  Kenya: [37.9, 0.2],
  // Americas
  "United States": [-98.5, 39.8],
  Canada: [-106.0, 56.0],
  Mexico: [-102.5, 23.6],
  Cuba: [-79.0, 21.5],
  Brazil: [-51.9, -10.8],
  Argentina: [-64.0, -34.0],
  Chile: [-71.0, -30.0],
  Colombia: [-74.0, 4.0],
  Peru: [-75.0, -10.0],
  // Oceania
  Australia: [134.0, -25.0],
  "New Zealand": [172.0, -41.0],
};

// First + last initial from a full name, e.g. "Vincent van Gogh" -> "VG".
function initials(name) {
  const parts = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Step 1: load both data files and confirm they read correctly.
// Fetches people.json and movements.json in parallel, verifies the
// responses, parses them as JSON, and logs the results to the console.
async function loadData() {
  try {
    const [peopleRes, movementsRes] = await Promise.all([
      fetch("/data/people.json"),
      fetch("/data/movements.json"),
    ]);

    if (!peopleRes.ok) throw new Error(`people.json: HTTP ${peopleRes.status}`);
    if (!movementsRes.ok) throw new Error(`movements.json: HTTP ${movementsRes.status}`);

    const people = await peopleRes.json();
    const movements = await movementsRes.json();

    console.log("✅ Data loaded");
    console.log(`people (${people.length}):`, people);
    console.log(`movements (${movements.length}):`, movements);

    return { people, movements };
  } catch (err) {
    console.error("❌ Failed to load data:", err);
  }
}

// Step 2: draw the world map with a Natural Earth projection.
// Creates a full-viewport <svg>, converts the world TopoJSON into GeoJSON,
// fits a Natural Earth projection to the viewport, and renders one <path>
// per country. Returns the projection so later steps can place points on it.
function drawMap() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3
    .select("#app")
    .append("svg")
    .attr("id", "map")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Convert the compact TopoJSON "countries" object into GeoJSON features.
  const countries = feature(worldTopo, worldTopo.objects.countries);

  // Natural Earth projection, scaled/translated to fill the viewport.
  const projection = d3
    .geoNaturalEarth1()
    .fitSize([width, height], { type: "Sphere" });
  const path = d3.geoPath(projection);

  // One <path> per country. Fill/stroke colours live in style.css (.country).
  svg
    .append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path);

  return { svg, projection, path };
}

// Step 3: place portrait clusters — initials in gold circles — at each
// country's coordinate, with same-country artists clustered tightly.
function placePortraits(people, { svg, projection }) {
  // Count artists per country so radius can respond to crowding: a solo
  // artist gets a large circle, while clustered ones shrink to pack tightly.
  const countByCountry = people.reduce((m, p) => {
    m[p.country] = (m[p.country] || 0) + 1;
    return m;
  }, {});
  const radiusFor = (count) => Math.max(11, 22 / Math.sqrt(count));

  // Turn each artist into a simulation node anchored at its country's
  // projected pixel coordinate (cx, cy). Start x/y at that anchor.
  const nodes = people.map((p) => {
    const coord = COUNTRY_COORDS[p.country];
    if (!coord) console.warn("⚠️ No coordinate for country:", p.country);
    const [cx, cy] = coord ? projection(coord) : [window.innerWidth / 2, window.innerHeight / 2];
    return { ...p, cx, cy, x: cx, y: cy, r: radiusFor(countByCountry[p.country]), label: initials(p.name) };
  });

  // Force layout: pull each node toward its country center while collision
  // (using each node's own radius) keeps circles from overlapping —
  // producing tight per-country clusters.
  const sim = d3
    .forceSimulation(nodes)
    .force("x", d3.forceX((d) => d.cx).strength(0.9))
    .force("y", d3.forceY((d) => d.cy).strength(0.9))
    .force("collide", d3.forceCollide((d) => d.r + 1))
    .stop();

  // Run it to settle synchronously (no animation in this step).
  for (let i = 0; i < 200; i++) sim.tick();

  // Draw one group per artist: a gold ring plus the initials.
  const portrait = svg
    .append("g")
    .attr("class", "portraits")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", (d) => `portrait type-${d.type}`)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

  // A circular clip so a photo (loaded later) fits neatly inside the ring.
  portrait
    .append("clipPath")
    .attr("id", (d) => `clip-${d.id}`)
    .append("circle")
    .attr("r", (d) => d.r);

  // Dark disc — the backdrop behind initials, hidden once a photo covers it.
  portrait
    .append("circle")
    .attr("class", "portrait-bg")
    .attr("r", (d) => d.r);

  // The photo, sized to the circle and clipped round. Starts hidden until
  // loadPortraitImages() fills in its href.
  portrait
    .append("image")
    .attr("class", "portrait-photo")
    .attr("x", (d) => -d.r)
    .attr("y", (d) => -d.r)
    .attr("width", (d) => d.r * 2)
    .attr("height", (d) => d.r * 2)
    .attr("clip-path", (d) => `url(#clip-${d.id})`)
    .attr("preserveAspectRatio", "xMidYMid slice")
    .style("display", "none");

  // Gold ring (stroke only) frames whatever sits inside.
  portrait
    .append("circle")
    .attr("class", "portrait-ring")
    .attr("r", (d) => d.r);

  // Initials — the fallback shown until/unless a photo loads.
  portrait
    .append("text")
    .attr("class", "portrait-initials")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", (d) => `${Math.round(d.r * 0.72)}px`)
    .text((d) => d.label);

  return portrait;
}

// Fetch a portrait photo for each person from the Wikipedia REST summary API
// (keyed by their `wikipedia` page title), clip it into the ring, and hide the
// initials once it loads. Resolved URLs — including "no image" — are cached in
// localStorage so repeat visits don't re-fetch. People without a photo keep
// their initials.
async function loadPortraitImages(portrait) {
  const nodes = portrait.data();
  const CACHE_KEY = "ka-portrait-images";
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {}

  // Swap in a photo for one person: show the image, hide their initials.
  function apply(d, src) {
    const sel = portrait.filter((n) => n === d);
    sel.select("image.portrait-photo").attr("href", src).style("display", null);
    sel.select("text.portrait-initials").style("display", "none");
  }

  await Promise.all(
    nodes.map(async (d) => {
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

// Format a year for display: negative values are BCE, positive are CE.
function formatYear(year) {
  return year < 0 ? `${-year} BCE` : `${year} CE`;
}

// Step 5: find the art movement covering a given year. If several overlap,
// pick the narrowest range as the most specific era. Returns "" in gaps.
function eraFor(year, movements) {
  const matches = movements.filter((m) => m.start <= year && year <= m.end);
  if (matches.length === 0) return "";
  matches.sort((a, b) => a.end - a.start - (b.end - b.start));
  return matches[0].name;
}

// --- Detail card (Stage 3) -------------------------------------------------

// Escape data text before injecting it as HTML.
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Compact, BCE-aware life span: "1840–1926", "563–483 BCE", "50–135 CE".
function lifespan(d) {
  if (d.born < 0 && d.died < 0) return `${-d.born}–${-d.died} BCE`;
  if (d.born < 0 && d.died >= 0) return `${-d.born} BCE – ${d.died} CE`;
  return `${d.born}–${d.died}`;
}

// The dim meta line under the name: movement · country · lifespan.
function metaLine(d) {
  return [d.movement, d.country, lifespan(d)].filter(Boolean).join("  ·  ");
}

// One labelled field. Shows a faint placeholder when you haven't filled it in.
function cardField(label, value, isQuote = false) {
  const has = value && String(value).trim();
  const body = has
    ? escapeHtml(value)
    : `<span class="card-empty">— add later —</span>`;
  return `<div class="card-field${isQuote ? " card-quote" : ""}">
      <span class="card-label">${label}</span>
      <span class="card-value">${body}</span>
    </div>`;
}

// Type-specific body: painting for artists, books + quote for authors,
// quote + school of thought for philosophers.
function cardBody(d) {
  if (d.type === "artist") {
    return cardField("Favourite painting", d.favourite_painting);
  }
  if (d.type === "author") {
    const books = Array.isArray(d.books_read) ? d.books_read.join(", ") : d.books_read;
    return (
      cardField("Books I've read", books) +
      cardField("A quote that stayed with me", d.quote, true)
    );
  }
  if (d.type === "philosopher") {
    return (
      cardField("A quote that stayed with me", d.quote, true) +
      cardField("School of thought", d.school || d.movement)
    );
  }
  return "";
}

// Wire hover (with a small close delay) + click-to-pin onto the portraits.
// Hovering shows the card; moving onto the card keeps it open; clicking a
// portrait pins it until you close it, click it again, or click away.
function setupDetailCard(portraits) {
  const card = document.querySelector("#detail-card");
  const closeBtn = card.querySelector(".card-close");
  let hideTimer = null;
  let pinned = false;
  let current = null;

  // Place the card beside the circle, flipping left near the right edge and
  // clamping vertically so it never spills off-screen.
  function positionCard(d) {
    const pad = 16;
    const rect = card.getBoundingClientRect();
    let left = d.x + d.r + 16;
    let top = d.y - rect.height / 2;
    if (left + rect.width > window.innerWidth - pad) {
      left = d.x - d.r - 16 - rect.width;
    }
    top = Math.max(pad, Math.min(top, window.innerHeight - rect.height - pad));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function show(d) {
    current = d;
    card.querySelector(".card-name").textContent = d.name;
    card.querySelector(".card-meta").textContent = metaLine(d);
    card.querySelector(".card-body").innerHTML = cardBody(d);
    card.classList.toggle("is-pinned", pinned);
    portraits.classed("is-focused", (n) => n === d); // glow the active circle
    positionCard(d);
    card.classList.remove("is-hidden");
  }

  function hide() {
    pinned = false;
    current = null;
    card.classList.add("is-hidden");
    card.classList.remove("is-pinned");
    portraits.classed("is-focused", false);
  }

  function scheduleHide() {
    if (pinned) return;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 220);
  }
  function cancelHide() {
    clearTimeout(hideTimer);
  }

  portraits
    .style("cursor", "pointer")
    .on("mouseenter", (event, d) => {
      if (pinned) return; // a pinned card stays put until dismissed
      cancelHide();
      show(d);
    })
    .on("mouseleave", scheduleHide)
    .on("click", (event, d) => {
      event.stopPropagation(); // don't let the document handler dismiss it
      if (pinned && current === d) return hide(); // click the same one to close
      pinned = true;
      cancelHide();
      show(d);
    });

  card.addEventListener("mouseenter", cancelHide);
  card.addEventListener("mouseleave", scheduleHide);
  closeBtn.addEventListener("click", hide);
  document.addEventListener("click", (e) => {
    if (pinned && !card.contains(e.target)) hide();
  });
}

// Year slider + category toggles. A portrait shows only when its type is
// enabled AND the person was alive (born <= year <= died) in the chosen year.
function setupControls(people, portraits, movements) {
  const minYear = Math.min(...people.map((p) => p.born));
  const maxYear = Math.max(...people.map((p) => p.died));

  // Default to the year with the most artists alive, so the initial view is
  // populated (mid-range years in this dataset can be empty).
  let startYear = minYear;
  let bestCount = -1;
  for (let y = minYear; y <= maxYear; y++) {
    const count = people.filter((p) => p.born <= y && y <= p.died).length;
    if (count > bestCount) {
      bestCount = count;
      startYear = y;
    }
  }

  const slider = document.querySelector("#year-slider");
  const label = document.querySelector("#year-label");
  const eraLabel = document.querySelector("#era-label");
  const controls = document.querySelector("#controls");
  const timelineToggle = document.querySelector("#timeline-toggle");

  // When true, the year filter is ignored and every enabled type is shown.
  let allEras = false;
  slider.min = minYear;
  slider.max = maxYear;
  slider.value = startYear;

  // Place a dot on the track at every century boundary within the range.
  const ticks = document.querySelector("#ticks");
  const firstCentury = Math.ceil(minYear / 100) * 100;
  for (let y = firstCentury; y <= maxYear; y += 100) {
    const dot = document.createElement("div");
    dot.className = "tick";
    dot.style.left = `${((y - minYear) / (maxYear - minYear)) * 100}%`;
    ticks.appendChild(dot);
  }

  // Which person types are currently shown. Buttons start active in the HTML.
  const activeTypes = new Set(["artist", "author", "philosopher"]);
  const filterButtons = document.querySelectorAll(".filter-btn");

  // A portrait is visible when its type is enabled and the person was alive
  // in the selected year. Also refreshes the year and era labels.
  function update() {
    const year = +slider.value;
    label.textContent = allEras ? "All eras" : formatYear(year);
    eraLabel.textContent = allEras ? "" : eraFor(year, movements);
    const isVisible = (d) =>
      activeTypes.has(d.type) && (allEras || (d.born <= year && year <= d.died));
    portraits.classed("is-alive", isVisible);
    portraits.classed("is-hidden", (d) => !isVisible(d));
  }

  slider.addEventListener("input", update);

  // Toggle the timeline off to see everyone at once, and back on to filter.
  timelineToggle.addEventListener("click", () => {
    allEras = !allEras;
    timelineToggle.classList.toggle("is-active", allEras);
    controls.classList.toggle("all-eras", allEras);
    update();
  });

  // Toggle a type on/off when its button is clicked.
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (activeTypes.has(type)) activeTypes.delete(type);
      else activeTypes.add(type);
      btn.classList.toggle("is-active");
      update();
    });
  });

  update();
}

// Load data, draw the map, then place the portraits in order.
async function init() {
  const data = await loadData();
  const map = drawMap();
  if (data) {
    const portraits = placePortraits(data.people, map);
    setupControls(data.people, portraits, data.movements);
    setupDetailCard(portraits);
    loadPortraitImages(portraits);
  }
}

init();
