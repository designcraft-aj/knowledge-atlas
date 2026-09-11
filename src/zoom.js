import * as d3 from "d3";
import { FOCUS_RADIUS, UNIFORM_R } from "./portraits.js";

const KNORM = 4; // zoom level by which every portrait has eased to UNIFORM_R
const GAP = 1; // px of on-screen breathing room between touching portraits

// Scroll/pinch to zoom, drag to pan, with +/−/reset buttons. The zoom-layer
// (map, portraits, veil) scales together, but each portrait is counter-scaled
// so, as you zoom in, it eases from its clustered base size toward a uniform
// thumbnail. A live force simulation keeps same-country portraits behaving like
// balls that touch and nudge each other into a tight cluster near their country
// (re-heated on every zoom). Panning is bounded so the map can't fly off-screen.
export function setupZoom(svg, zoomLayer, portraits) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const nodes = portraits.data();

  let curK = 1; // current zoom scale

  // On-screen radius a portrait eases to: its clustered base radius at k=1,
  // toward the uniform UNIFORM_R by KNORM.
  function targetRadius(d) {
    const t = Math.max(0, Math.min(1, (curK - 1) / (KNORM - 1)));
    return d.r + (UNIFORM_R - d.r) * t;
  }

  // Draw each portrait from its live simulation position: counter-scale so it
  // renders at targetRadius on screen, keep hover-focus a constant 60px, and
  // record focusRadius (on-screen) so the detail card stays aligned.
  function applyTransforms() {
    portraits
      .attr("transform", (d) => {
        const s = targetRadius(d) / (d.r * curK); // cancels zoom, hits targetR
        return `translate(${d.x}, ${d.y}) scale(${s})`;
      })
      .style("--focus-scale", (d) => FOCUS_RADIUS / targetRadius(d));
    nodes.forEach((d) => (d.focusRadius = FOCUS_RADIUS / curK));
  }

  // Collision radius in layer coords: touching balls sit 2·targetRadius apart on
  // screen, held constant on screen (÷ curK) so the cluster doesn't spread out.
  // Nodes not in the current view (inView === false) don't collide.
  const collideRadius = (d) =>
    d.inView === false ? 0 : (targetRadius(d) + GAP) / curK;

  // Live force layout: pull each portrait to its cluster center (d.cx/d.cy —
  // country in People view, museum in Artworks view) while collision makes
  // co-located portraits touch and push apart like balls. High velocityDecay
  // (friction) keeps the motion slow and calm rather than snappy.
  const fx = d3.forceX((d) => d.cx).strength(0.5);
  const fy = d3.forceY((d) => d.cy).strength(0.5);
  const collide = d3.forceCollide(collideRadius).strength(0.9);
  const sim = d3
    .forceSimulation(nodes)
    .force("x", fx)
    .force("y", fy)
    .force("collide", collide)
    .velocityDecay(0.6)
    .alphaDecay(0.05)
    .on("tick", applyTransforms)
    .stop();

  // Re-target the forces (after d.cx/d.cy or inView change) and animate the
  // portraits into their new packing. Used by the view toggle.
  function reheat(alpha = 0.7) {
    fx.x((d) => d.cx);
    fy.y((d) => d.cy);
    collide.radius(collideRadius);
    sim.alpha(alpha).restart();
  }

  // Settle the default (k=1) layout synchronously, then paint it.
  sim.alpha(1);
  for (let i = 0; i < 200; i++) sim.tick();
  applyTransforms();

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8]) // 1× = full world; up to 8× in
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    // Keep the sim gently warm only while actively zooming, then let it cool —
    // so a zoom nudges the balls softly instead of exploding them.
    .on("start.sim", () => sim.alphaTarget(0.08).restart())
    .on("end.sim", () => sim.alphaTarget(0))
    .on("zoom", (event) => {
      zoomLayer.attr("transform", event.transform);
      const k = event.transform.k;
      if (k !== curK) {
        curK = k;
        collide.radius(collideRadius); // refresh collision radii for new zoom
        applyTransforms(); // immediate size update
      }
    });

  // Attach to the SVG; free up double-click so it doesn't fight portrait clicks.
  svg.call(zoom).on("dblclick.zoom", null);

  const on = (id, fn) => document.querySelector(id).addEventListener("click", fn);
  on("#zoom-in", () => svg.transition().duration(200).call(zoom.scaleBy, 1.5));
  on("#zoom-out", () => svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5));
  on("#zoom-reset", () =>
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity)
  );

  // Snap back to the full-world view (used when switching modes).
  function reset() {
    svg.call(zoom.transform, d3.zoomIdentity);
  }

  return { reheat, reset };
}
