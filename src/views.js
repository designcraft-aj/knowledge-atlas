import * as d3 from "d3";
import { view } from "./state.js";
import { COUNTRY_COORDS } from "./country-coords.js";
import { MUSEUM_COORDS } from "./museum-coords.js";

// The People ↔ Artworks toggle. Rather than a second set of elements, it reuses
// the existing portrait nodes: it swaps each node's cluster center (country of
// origin ↔ the museum where its painting lives), swaps its thumbnail (portrait
// photo ↔ painting), re-applies visibility, and re-heats the force sim so the
// portraits animate into their new packing.
export function setupViews(portraits, projection, controls, zoom, card) {
  const nodes = portraits.data();
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Precompute both cluster centers. d.cx/d.cy already hold the country center
  // (People). Artworks uses the museum coordinate, falling back to origin.
  nodes.forEach((d) => {
    d.centerPeople = [d.cx, d.cy];
    const coord =
      (d.location && MUSEUM_COORDS[d.location]) || COUNTRY_COORDS[d.country];
    d.centerArt = coord ? projection(coord) : [w / 2, h / 2];
    d.inView = true; // People view: everyone participates in collision
  });

  // Swap each portrait's thumbnail to match the mode; fall back to initials
  // when the relevant image hasn't resolved.
  function applyThumbnails() {
    portraits.each(function (d) {
      const url = view.mode === "artworks" ? d.paintingImage : d.photo;
      const img = d3.select(this).select("image.portrait-photo");
      const initials = d3.select(this).select("text.portrait-initials");
      if (url) {
        img.attr("href", url).attr("xlink:href", url).style("display", null);
        initials.style("display", "none");
      } else {
        img.style("display", "none");
        initials.style("display", null);
      }
    });
  }

  const modeButtons = document.querySelectorAll("#filters .filter-btn[data-mode]");

  function setMode(mode) {
    view.mode = mode;
    const art = mode === "artworks";
    document.body.classList.toggle("artworks-view", art);
    modeButtons.forEach((b) =>
      b.classList.toggle("is-active", b.dataset.mode === mode)
    );

    // Re-target the sim: pick the mode's center, mark which nodes participate in
    // collision, and snap each portrait near its new center so it settles in
    // place rather than flying across the map.
    nodes.forEach((d) => {
      const [cx, cy] = art ? d.centerArt : d.centerPeople;
      d.cx = cx;
      d.cy = cy;
      d.inView = art ? d.type === "artist" : true;
      d.x = cx + (Math.random() - 0.5) * 4;
      d.y = cy + (Math.random() - 0.5) * 4;
    });

    card.hide(); // dismiss any open card (it may not belong to the new mode)
    applyThumbnails();
    controls.update(); // re-apply which portraits are visible
    zoom.reset(); // back to the full-world view so clusters are on-screen
    zoom.reheat(); // animate into the new packing
  }

  modeButtons.forEach((b) =>
    b.addEventListener("click", () => {
      if (view.mode !== b.dataset.mode) setMode(b.dataset.mode);
    })
  );
}
