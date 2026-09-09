// Small shared helpers used across the map, card, and controls.

// First + last initial from a full name, e.g. "Vincent van Gogh" -> "VG".
export function initials(name) {
  const parts = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Format a year for display: negative values are BC, positive are AD.
export function formatYear(year) {
  return year < 0 ? `${-year} BC` : `${year} AD`;
}

// Escape data text before injecting it as HTML.
export function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Compact, BC/AD-aware life span: "1840–1926", "563–483 BC", "50–135 AD".
export function lifespan(d) {
  if (d.born < 0 && d.died < 0) return `${-d.born}–${-d.died} BC`;
  if (d.born < 0 && d.died >= 0) return `${-d.born} BC – ${d.died} AD`;
  return `${d.born}–${d.died}`;
}
