// The About panel: the info button opens it; the ×, the backdrop, or Escape
// closes it.
export function setupAbout() {
  const btn = document.querySelector("#info-btn");
  const panel = document.querySelector("#about-panel");
  const backdrop = document.querySelector("#about-backdrop");
  const closeBtn = panel.querySelector(".about-close");

  function open() {
    panel.classList.remove("is-hidden");
    backdrop.classList.remove("is-hidden");
  }
  function close() {
    panel.classList.add("is-hidden");
    backdrop.classList.add("is-hidden");
  }

  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
