import * as d3 from "d3";

// Scroll/pinch to zoom, drag to pan, with +/−/reset buttons. Everything in the
// zoom-layer (map, portraits, veil) scales together. Panning is bounded to the
// viewport so the map can't be flung off-screen.
export function setupZoom(svg, zoomLayer) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8]) // 1× = full world; up to 8× in
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event) => zoomLayer.attr("transform", event.transform));

  // Attach to the SVG; free up double-click so it doesn't fight portrait clicks.
  svg.call(zoom).on("dblclick.zoom", null);

  const on = (id, fn) => document.querySelector(id).addEventListener("click", fn);
  on("#zoom-in", () => svg.transition().duration(200).call(zoom.scaleBy, 1.5));
  on("#zoom-out", () => svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5));
  on("#zoom-reset", () =>
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity)
  );
}
