import { put, get, ago } from "./store.js";

const main = document.querySelector("main[data-slug]");
if (main) {
  const slug = main.dataset.slug;
  const title = main.dataset.title;
  const num = main.dataset.num;
  const chapterIndex = Number(main.dataset.index ?? 0);
  const chapterTotal = Number(main.dataset.total ?? 1);
  const startShare = Number(main.dataset.start ?? 0);
  const chapterShare = Number(main.dataset.share ?? 0);
  const bar = document.getElementById("resume");
  const header = document.querySelector(".bar");
  const anchors = [...main.querySelectorAll("[data-anchor]")];

  function position() {
    const limit = Math.max(0, header ? header.getBoundingClientRect().bottom : 56) + 8;
    let current = anchors[0];
    for (const el of anchors) {
      if (el.getBoundingClientRect().top <= limit) current = el;
      else break;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    return {
      y,
      anchor: current ? Number(current.dataset.anchor) : 0,
      ratio: max > 0 ? Math.min(1, Math.max(0, y / max)) : 0,
    };
  }

  let last = null;
  let timer = 0;

  function save() {
    if (!last || last.y < 40) return;
    put(slug, {
      anchor: last.anchor,
      ratio: last.ratio,
      num,
      title,
      chapterIndex,
      chapterTotal,
      bookProgress: startShare + last.ratio * chapterShare,
    });
  }

  let lastHeight = 0;

  function schedule() {
    if (document.visibilityState === "hidden") return;
    const height = document.documentElement.scrollHeight;
    if (lastHeight && Math.abs(height - lastHeight) > 60) return;
    lastHeight = height;
    last = position();
    window.clearTimeout(timer);
    timer = window.setTimeout(save, 250);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    window.clearTimeout(timer);
    save();
  });

  const saved = get(slug);
  if (bar && saved && window.scrollY < 300) {
    const target = anchors.find((el) => Number(el.dataset.anchor) === saved.anchor) ?? null;
    const where = saved.ratio > 0.97 ? "上次读完了这一章" : `上次读到 ${Math.round(saved.ratio * 100)}%`;
    bar.innerHTML = `
      <span class="resume-text">${where}<span class="meta"> · ${ago(saved.at)}</span></span>
      <span class="resume-actions">
        <button type="button" class="resume-go">${saved.ratio > 0.97 ? "从头再读" : "继续"}</button>
        <button type="button" class="resume-close" aria-label="关闭">×</button>
      </span>`;
    bar.hidden = false;

    bar.querySelector(".resume-go").addEventListener("click", () => {
      if (saved.ratio > 0.97 || !target) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const y = window.scrollY + target.getBoundingClientRect().top - 72;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
      bar.hidden = true;
    });
    bar.querySelector(".resume-close").addEventListener("click", () => {
      bar.hidden = true;
    });
  }
}
