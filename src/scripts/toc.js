import { load } from "./store.js";

export function initToc() {
  const dialog = document.getElementById("toc");
  const open = document.getElementById("open-toc");
  if (!dialog || !open) return;

  const items = [...dialog.querySelectorAll("li[data-slug]")];
  const all = load();

  for (const li of items) {
    const entry = all[li.dataset.slug];
    if (!entry) continue;
    const pct = Math.round((entry.ratio ?? 0) * 100);
    li.classList.add("touched");
    li.style.setProperty("--p", String(entry.ratio ?? 0));
    const badge = li.querySelector(".pct");
    if (badge) badge.textContent = pct > 97 ? "读完" : `${pct}%`;
  }

  open.addEventListener("click", () => {
    dialog.showModal();
    dialog.focus();
    const current = dialog.querySelector("li.current");
    if (current) current.scrollIntoView({ block: "center" });
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  for (const close of dialog.querySelectorAll("[data-close]")) {
    close.addEventListener("click", () => dialog.close());
  }
}
