// Light/dark theme toggle. Adds/removes `light` on <body> (the CSS palette
// variables switch to the latte theme), swaps the button icon, and remembers
// the choice in localStorage across visits.
const KEY = "ka-theme";

export function setupTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function apply(theme) {
    const light = theme === "light";
    document.body.classList.toggle("light", light);
    btn.textContent = light ? "☾" : "☀"; // moon → go dark, sun → go light
    btn.setAttribute("aria-pressed", String(light));
  }

  let theme = "dark";
  try {
    theme = localStorage.getItem(KEY) || "dark";
  } catch {}
  apply(theme);

  btn.addEventListener("click", () => {
    theme = document.body.classList.contains("light") ? "dark" : "light";
    apply(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
  });
}
