import { escapeHtml, lifespan } from "./util.js";

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

// The favourite-painting field, with the fetched artwork image when available.
function cardPaintingField(d) {
  const value =
    d.favourite_painting && d.favourite_painting.trim()
      ? escapeHtml(d.favourite_painting)
      : `<span class="card-empty">— add later —</span>`;
  const img = d.paintingImage
    ? `<img class="card-painting" src="${escapeHtml(d.paintingImage)}" alt="${escapeHtml(
        d.favourite_painting || ""
      )}" referrerpolicy="no-referrer" onerror="this.remove()">`
    : "";
  return `<div class="card-field">
      <span class="card-label">Favourite painting</span>
      <span class="card-value">${value}</span>
      ${img}
    </div>`;
}

// Type-specific body: painting for artists, books + quote for authors,
// quote + school of thought for philosophers.
function cardBody(d) {
  if (d.type === "artist") {
    return cardPaintingField(d);
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
export function setupDetailCard(portraits) {
  const card = document.querySelector("#detail-card");
  const closeBtn = card.querySelector(".card-close");
  let hideTimer = null;
  let pinned = false;
  let current = null;

  // A dim veil over the map, plus a top layer that holds the active portrait
  // above the veil so only it (and the card) stay bright. Both live inside the
  // SVG so the on-map portrait can sit above the veil.
  const svg = document.querySelector("#map");
  const portraitsGroup = document.querySelector("#map .portraits");
  const SVGNS = "http://www.w3.org/2000/svg";
  const overlay = document.createElementNS(SVGNS, "rect");
  overlay.setAttribute("class", "dim-overlay is-hidden");
  overlay.setAttribute("x", "0");
  overlay.setAttribute("y", "0");
  overlay.setAttribute("width", "100%");
  overlay.setAttribute("height", "100%");
  svg.appendChild(overlay);
  const topLayer = document.createElementNS(SVGNS, "g");
  topLayer.setAttribute("class", "portrait-top-layer");
  svg.appendChild(topLayer);

  // Move a portrait above the veil (returning any previous one first).
  function raisePortrait(d) {
    clearRaise();
    const node = portraits.filter((n) => n === d).node();
    if (node) topLayer.appendChild(node);
  }
  function clearRaise() {
    while (topLayer.firstChild) portraitsGroup.appendChild(topLayer.firstChild);
  }

  // Place the card beside the circle, flipping left near the right edge and
  // clamping vertically so it never spills off-screen.
  function positionCard(d) {
    const pad = 16;
    const rect = card.getBoundingClientRect();
    const fr = d.focusRadius ?? d.r; // the zoomed radius the card sits beside
    let left = d.x + fr + 16;
    let top = d.y - fr; // align the card's top with the zoomed portrait's top
    if (left + rect.width > window.innerWidth - pad) {
      left = d.x - fr - 16 - rect.width;
    }
    left = Math.max(pad, Math.min(left, window.innerWidth - rect.width - pad));
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
    raisePortrait(d); // lift it above the dim veil
    overlay.classList.remove("is-hidden");
    // A painting image loads without known dimensions — re-place once it's in.
    const img = card.querySelector(".card-painting");
    if (img && !img.complete) {
      img.addEventListener(
        "load",
        () => {
          if (current === d) positionCard(d);
        },
        { once: true }
      );
    }
    positionCard(d);
    card.classList.remove("is-hidden");
  }

  function hide() {
    pinned = false;
    current = null;
    card.classList.add("is-hidden");
    card.classList.remove("is-pinned");
    portraits.classed("is-focused", false);
    overlay.classList.add("is-hidden");
    clearRaise();
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
  // A click on empty space dismisses the card — whether pinned or just
  // hovering. Portrait clicks stopPropagation above, so they pin instead.
  document.addEventListener("click", (e) => {
    if (!card.contains(e.target)) hide();
  });
}
