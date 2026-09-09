import * as d3 from "d3";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";

// Draw the world map with a Natural Earth projection.
// Creates a full-viewport <svg>, converts the world TopoJSON into GeoJSON,
// fits a Natural Earth projection to the viewport, and renders one <path>
// per country. Returns the projection so later steps can place points on it.
export function drawMap() {
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
  // Nudge the whole map — and the portraits placed on it — down a little.
  const [tx, ty] = projection.translate();
  projection.translate([tx, ty + 20]);
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
