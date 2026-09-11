import "./style.css";
import { loadData } from "./data.js";
import { drawMap } from "./map.js";
import { placePortraits } from "./portraits.js";
import { setupControls } from "./controls.js";
import { setupDetailCard } from "./card.js";
import { loadPortraitImages, loadPaintingImages } from "./images.js";
import { setupAbout } from "./about.js";
import { setupZoom } from "./zoom.js";
import { setupCursor } from "./cursor.js";
import { setupLoupe } from "./loupe.js";
import { setupViews } from "./views.js";
import { setupTheme } from "./theme.js";

// Load data, draw the map, then place portraits and wire up interactions.
async function init() {
  setupCursor();
  setupTheme();
  setupAbout();
  const data = await loadData();
  const map = drawMap();
  if (data) {
    const portraits = placePortraits(data.people, map);
    const controls = setupControls(data.people, portraits, data.movements);
    const card = setupDetailCard(portraits);
    loadPortraitImages(portraits);
    loadPaintingImages(portraits);
    const zoom = setupZoom(map.svg, map.zoomLayer, portraits);
    setupLoupe(map.svg);
    setupViews(portraits, map.projection, controls, zoom, card);
  }
}

init();
