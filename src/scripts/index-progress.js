import { latest, get, ago, label } from "./store.js";

const base = document.body.dataset.base ?? "/";
const card = document.getElementById("resume-card");
const last = latest();

if (card && last) {
  const href = `${base}${last.slug}/${last.ratio > 0.02 ? `#b-${last.anchor}` : ""}`;
  const percent = Math.round(last.ratio * 100);
  card.innerHTML = `
    <a class="resume-link" href="${href}">
      <span class="resume-kicker">继续阅读</span>
      <span class="resume-title">${label(last.num, last.title)}</span>
      <span class="resume-meta">${percent > 3 ? `读到 ${percent}%` : "刚开始"} · ${ago(last.at)}</span>
    </a>`;
  card.hidden = false;
}

for (const row of document.querySelectorAll(".toc li[data-slug]")) {
  const entry = get(row.dataset.slug);
  if (!entry) continue;
  const percent = Math.round(entry.ratio * 100);
  row.classList.add("touched");
  row.style.setProperty("--p", String(entry.ratio));
  const state = document.createElement("span");
  state.className = "state";
  (row.querySelector("a") ?? row).appendChild(state);
  state.textContent = percent > 97 ? "读完" : `${percent}%`;
}
