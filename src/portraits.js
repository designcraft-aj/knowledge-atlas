import * as d3 from "d3";
import { COUNTRY_COORDS } from "./country-coords.js";
import { initials } from "./util.js";

// Place portrait clusters — initials in gold circles — at each country's
// coordinate, with same-country people clustered tightly. Returns the d3
// selection of portrait groups so later steps can bind behaviour to them.
export function placePortraits(people, { zoomLayer, projection }) {
  // Count people per country so radius can respond to crowding: a solo
  // person gets a large circle, while clustered ones shrink to pack tightly.
  const countByCountry = people.reduce((m, p) => {
    m[p.country] = (m[p.country] || 0) + 1;
    return m;
  }, {});
  const radiusFor = (count) => Math.max(11, 22 / Math.sqrt(count));

  // Turn each person into a simulation node anchored at its country's
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

  // Draw one group per person: a gold ring plus the initials.
  const portrait = zoomLayer
    .append("g")
    .attr("class", "portraits")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", (d) => `portrait type-${d.type}`)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

  // Per-node scale that grows the thumbnail to a 60px circle (radius 30) when
  // focused. focusRadius is stored on the node so the card can align to the
  // zoomed size; the scale factor is read by CSS as var(--focus-scale).
  const FOCUS_RADIUS = 30;
  portrait
    .each((d) => (d.focusRadius = FOCUS_RADIUS))
    .style("--focus-scale", (d) => FOCUS_RADIUS / d.r);

  // Inner group that scales on hover — the outer group keeps the translate.
  const scale = portrait.append("g").attr("class", "portrait-scale");

  // A circular clip so a photo (loaded later) fits neatly inside.
  scale
    .append("clipPath")
    .attr("id", (d) => `clip-${d.id}`)
    .append("circle")
    .attr("r", (d) => d.r);

  // Dark disc — the backdrop behind initials, hidden once a photo covers it.
  scale
    .append("circle")
    .attr("class", "portrait-bg")
    .attr("r", (d) => d.r);

  // The photo, sized to the circle and clipped round. Starts hidden until
  // loadPortraitImages() fills in its href.
  scale
    .append("image")
    .attr("class", "portrait-photo")
    .attr("x", (d) => -d.r)
    .attr("y", (d) => -d.r)
    .attr("width", (d) => d.r * 2)
    .attr("height", (d) => d.r * 2)
    .attr("clip-path", (d) => `url(#clip-${d.id})`)
    .attr("preserveAspectRatio", "xMidYMid slice")
    .style("display", "none");

  // Initials — the fallback shown until/unless a photo loads.
  scale
    .append("text")
    .attr("class", "portrait-initials")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", (d) => `${Math.round(d.r * 0.72)}px`)
    .text((d) => d.label);

  return portrait;
}
