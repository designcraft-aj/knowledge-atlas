// Shared, mutable view state. `mode` is either "people" (portraits placed by
// country of origin) or "artworks" (painting thumbnails placed at the museum
// where the work currently lives). Modules read this to render mode-aware.
export const view = { mode: "people" };
