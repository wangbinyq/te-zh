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

  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function position() {
    const max = maxScroll();
    const y = window.scrollY;
    return { y, max, ratio: max > 0 ? Math.min(1, Math.max(0, y / max)) : 0 };
  }

  let leaving = false;
  document.addEventListener(
    "click",
    (event) => {
      if (event.target.closest?.("a[href]")) leaving = true;
    },
    true,
  );

  let last = null;
  let timer = 0;

  function save() {
    if (!last || last.y < 40 || last.max < 200) return;
    put(slug, {
      ratio: last.ratio,
      num,
      title,
      chapterIndex,
      chapterTotal,
      bookProgress: startShare + last.ratio * chapterShare,
    });
  }

  function schedule() {
    if (leaving) return;
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

  function jumpTo(ratio) {
    const target = Math.round(Math.min(1, Math.max(0, ratio)) * maxScroll());
    window.scrollTo({ top: target, behavior: "auto" });
    return target;
  }

  const hash = location.hash.match(/^#r-([\d.]+)$/);
  if (hash) {
    const ratio = Number(hash[1]) / 100;
    let tries = 0;
    const settle = () => {
      const target = jumpTo(ratio);
      tries += 1;
      if (tries < 8 && Math.abs(window.scrollY - target) > 24) setTimeout(settle, 120 * tries);
    };
    requestAnimationFrame(settle);
  } else {
    const saved = get(slug);
    if (bar && saved && window.scrollY < 300) {
      const where = saved.ratio > 0.97 ? "上次读完了这一章" : `上次读到 ${Math.round(saved.ratio * 100)}%`;
      bar.innerHTML = `
        <span class="resume-text">${where}<span class="meta"> · ${ago(saved.at)}</span></span>
        <span class="resume-actions">
          <button type="button" class="resume-go">${saved.ratio > 0.97 ? "从头再读" : "继续"}</button>
          <button type="button" class="resume-close" aria-label="关闭">×</button>
        </span>`;
      bar.hidden = false;

      bar.querySelector(".resume-go").addEventListener("click", () => {
        jumpTo(saved.ratio > 0.97 ? 0 : saved.ratio);
        bar.hidden = true;
      });
      bar.querySelector(".resume-close").addEventListener("click", () => {
        bar.hidden = true;
      });
    }
  }
}
