import { put, get, ago } from "./store.js";

const main = document.querySelector("main[data-slug]");
if (main) {
  const slug = main.dataset.slug;
  const title = main.dataset.title;
  const num = main.dataset.num;
  const chapterIndex = Number(main.dataset.index ?? 0);
  const chapterTotal = Number(main.dataset.total ?? 1);
  const bar = document.getElementById("resume");
  const anchors = [...main.querySelectorAll("[data-anchor]")];

  const top = () => (bar && !bar.hidden ? bar.getBoundingClientRect().bottom : 64) + 8;

  function position() {
    const limit = top();
    let current = anchors[0];
    for (const el of anchors) {
      if (el.getBoundingClientRect().top <= limit) current = el;
      else break;
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return {
      anchor: current ? Number(current.dataset.anchor) : 0,
      ratio: max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0,
    };
  }

  let timer = 0;
  function commit() {
    if (window.scrollY < 40) return;
    if (document.documentElement.scrollHeight - window.innerHeight < 200) return;
    const { anchor, ratio } = position();
    put(slug, { anchor, ratio, num, title, chapterIndex, chapterTotal });
  }

  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(commit, 600);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("pagehide", commit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") commit();
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
