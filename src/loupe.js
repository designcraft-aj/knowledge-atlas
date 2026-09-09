// Magnifier lens (loupe). A gold-ringed circular lens that follows the cursor
// and shows a magnified, vector-crisp slice of the map beneath it. Toggled by
// the #loupe-toggle button. It references the live #zoom-layer via <use>, so it
// magnifies whatever is currently on screen (including the current pan/zoom).

const R = 72; // lens radius in px
const K = 2.2; // magnification factor

export function setupLoupe(svg) {
  const btn = document.getElementById("loupe-toggle");
  if (!btn) return;

  // Circular clip that follows the cursor — trims the magnified copy to a disc.
  const clipCircle = svg
    .append("defs")
    .append("clipPath")
    .attr("id", "loupe-clip")
    .append("circle")
    .attr("r", R);

  // The lens sits above everything and never intercepts pointer events, so the
  // real portraits underneath stay hoverable/clickable through it.
  const loupe = svg.append("g").attr("class", "loupe is-hidden");
  // Opaque disc so ocean gaps (which are just page background) read as solid.
  const bg = loupe.append("circle").attr("class", "loupe-bg").attr("r", R);
  // Magnified copy of the whole map layer, clipped to the lens circle.
  const view = loupe
    .append("use")
    .attr("href", "#zoom-layer")
    .attr("xlink:href", "#zoom-layer") // fallback for older SVG renderers
    .attr("clip-path", "url(#loupe-clip)");
  // Gold ring border on top.
  const ring = loupe.append("circle").attr("class", "loupe-ring").attr("r", R);

  let active = false;

  // Track the cursor: move the clip/bg/ring, and magnify around (x, y) by K.
  function move(e) {
    const x = e.clientX;
    const y = e.clientY;
    clipCircle.attr("cx", x).attr("cy", y);
    bg.attr("cx", x).attr("cy", y);
    ring.attr("cx", x).attr("cy", y);
    view.attr(
      "transform",
      `translate(${x},${y}) scale(${K}) translate(${-x},${-y})`
    );
  }

  function enable() {
    active = true;
    loupe.classed("is-hidden", false);
    window.addEventListener("mousemove", move);
  }
  function disable() {
    active = false;
    loupe.classed("is-hidden", true);
    window.removeEventListener("mousemove", move);
  }

  btn.addEventListener("click", () => {
    btn.classList.toggle("is-active");
    active ? disable() : enable();
  });

  // Don't leave a stuck lens when the pointer goes off-window.
  document.addEventListener("mouseleave", () => {
    if (active) loupe.classed("is-hidden", true);
  });
  document.addEventListener("mouseenter", () => {
    if (active) loupe.classed("is-hidden", false);
  });
}
