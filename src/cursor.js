// Custom cursor: a small gold dot that tracks the pointer, growing slightly
// over clickable elements. Only fine pointers (a real mouse) get this — touch
// and coarse pointers keep the native cursor.

// Selectors for anything clickable, so the dot can grow to signal it.
const INTERACTIVE =
  "a, button, input, textarea, select, .portrait, [role='button']";

export function setupCursor() {
  // Bail on touch / coarse pointers — there's no hardware cursor to replace.
  if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.append(dot);
  document.body.classList.add("custom-cursor");

  // Move the dot to the pointer; reveal the cursor on first move.
  window.addEventListener("mousemove", (e) => {
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    document.body.classList.add("cursor-active");
  });

  // Hide when the pointer leaves the window; it re-appears on the next move.
  document.addEventListener("mouseleave", () => {
    document.body.classList.remove("cursor-active");
  });

  // Grow the dot over clickable things.
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest?.(INTERACTIVE)) {
      document.body.classList.add("cursor-hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest?.(INTERACTIVE)) {
      document.body.classList.remove("cursor-hover");
    }
  });
}
