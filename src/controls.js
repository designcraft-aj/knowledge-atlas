import { formatYear } from "./util.js";

// Find the art movement covering a given year. If several overlap, pick the
// narrowest range as the most specific era. Returns "" in gaps.
function eraFor(year, movements) {
  const matches = movements.filter((m) => m.start <= year && year <= m.end);
  if (matches.length === 0) return "";
  matches.sort((a, b) => a.end - a.start - (b.end - b.start));
  return matches[0].name;
}

// Year slider + category toggles. A portrait shows only when its type is
// enabled AND the person was alive (born <= year <= died) in the chosen year.
export function setupControls(people, portraits, movements) {
  const minYear = Math.min(...people.map((p) => p.born));
  const maxYear = Math.max(...people.map((p) => p.died));

  // Default to the year with the most people alive, so the initial view is
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
