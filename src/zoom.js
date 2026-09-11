import * as d3 from "d3";
import { FOCUS_RADIUS, UNIFORM_R } from "./portraits.js";

// Zoom level by which every portrait has fully eased to its uniform size and
// tight uniform packing.
const KNORM = 4;

// Scroll/pinch to zoom, drag to pan, with +/−/reset buttons. Everything in the
// zoom-layer (map, portraits, veil) scales together, but each portrait gets an
// inverse scale so that, as you zoom in, it eases from its clustered base size
// toward a uniform 32px thumbnail — and its position eases to a tight uniform
// packing kept at a constant on-screen size, so the cluster stays near its
// country instead of spreading. Panning is bounded so the map can't be flung
// off-screen.
export function setupZoom(svg, zoomLayer, portraits) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // For a given zoom k, reshape every portrait:
  //  - size eases from its base radius to UNIFORM_R (via an inverse scale that
  //    cancels the map zoom),
  //  - position eases from its base clustered offset to the uniform-packing
  //    offset, held at a constant on-screen size (offset/k in layer coords),
  //  - hover focus stays a constant FOCUS_RADIUS on screen,
  //  - px/py record the portrait's current center so the card stays aligned.
  function normalizePortraits(k) {
    const t = Math.max(0, Math.min(1, (k - 1) / (KNORM - 1)));
    portraits
      .attr("transform", (d) => {
        const targetR = d.r + (UNIFORM_R - d.r) * t;
        const s = targetR / (d.r * k); // outer scale: cancels zoom, hits targetR
        d.focusRadius = FOCUS_RADIUS * s; // keep card aligned to on-screen focus
        // Ease the on-screen offset from base cluster → uniform packing, then
        // divide by k so it's a constant on-screen size (doesn't spread).
        const baseOx = d.x - d.cx;
        const baseOy = d.y - d.cy;
        const offx = baseOx + (d.uox - baseOx) * t;
        const offy = baseOy + (d.uoy - baseOy) * t;
        d.px = d.cx + offx / k;
        d.py = d.cy + offy / k;
        return `translate(${d.px}, ${d.py}) scale(${s})`;
      })
      // Focus scale (inner group) so a hovered portrait is always ~60px on
      // screen regardless of zoom level.
      .style("--focus-scale", (d) => {
        const targetR = d.r + (UNIFORM_R - d.r) * t;
        return FOCUS_RADIUS / targetR;
      });
  }

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8]) // 1× = full world; up to 8× in
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event) => {
      zoomLayer.attr("transform", event.transform);
      normalizePortraits(event.transform.k);
    });

  // Attach to the SVG; free up double-click so it doesn't fight portrait clicks.
  svg.call(zoom).on("dblclick.zoom", null);

  // Initialise at k=1 so px/py/focusRadius are set before any zoom.
  normalizePortraits(1);

  const on = (id, fn) => document.querySelector(id).addEventListener("click", fn);
  on("#zoom-in", () => svg.transition().duration(200).call(zoom.scaleBy, 1.5));
  on("#zoom-out", () => svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5));
  on("#zoom-reset", () =>
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity)
  );
}
