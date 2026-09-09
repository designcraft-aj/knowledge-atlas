import "./style.css";
import { loadData } from "./data.js";
import { drawMap } from "./map.js";
import { placePortraits } from "./portraits.js";
import { setupControls } from "./controls.js";
import { setupDetailCard } from "./card.js";
import { loadPortraitImages, loadPaintingImages } from "./images.js";
import { setupAbout } from "./about.js";
import { setupZoom } from "./zoom.js";

// Load data, draw the map, then place portraits and wire up interactions.
async function init() {
  setupAbout();
  const data = await loadData();
  const map = drawMap();
  if (data) {
    const portraits = placePortraits(data.people, map);
    setupControls(data.people, portraits, data.movements);
    setupDetailCard(portraits);
    loadPortraitImages(portraits);
    loadPaintingImages(portraits);
    setupZoom(map.svg, map.zoomLayer);
  }
}

init();
