import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "src", "data");

export function zhFiles(slug) {
  const dir = path.join(dataDir, "zh");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f === `${slug}.txt` || f.startsWith(`${slug}.part`))
    .sort()
    .map((f) => path.join(dir, f));
}

export function readZh(slug) {
  const files = zhFiles(slug);
  if (!files.length) return null;
  const map = new Map();
  for (const file of files) readInto(file, map);
  return map;
}

function readInto(file, map) {
  let current = null;
  let rows = null;
  const flush = () => {
    if (current === null || !rows) return;
    map.set(current, { rows });
  };
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.replace(/[ \t\r]+$/, "");
    if (!line.trim() && !line.includes("\u3000")) continue;
    const m = line.match(/^@@\s+(\d+)(?:\s+\[(\w+)\])?/);
    if (m) {
      flush();
      current = Number(m[1]);
      rows = m[2] === "table" ? [] : null;
      continue;
    }
    if (current === null) continue;
    if (rows) rows.push(line.split(" | ").map((c) => c.trim()));
    else map.set(current, { text: line });
  }
  flush();
}

let figureCache = null;

export function figures() {
  if (!figureCache) {
    const file = path.join(dataDir, "figures.json");
    figureCache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  }
  return figureCache;
}

export function loadChapter(slug) {
  const file = path.join(dataDir, "source", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const source = JSON.parse(fs.readFileSync(file, "utf8"));
  const figMap = figures()[slug] ?? {};
  const zh = readZh(slug);
  const blocks = source.map((block, i) => {
    const tr = zh?.get(i) ?? null;
    const zhText = tr?.text ?? null;
    const pageOnly =
      typeof zhText === "string" &&
      (/^\d{1,4}$/.test(zhText.trim()) || /^[\s\u3000]*$/.test(zhText));
    return {
      i,
      skip: pageOnly || Boolean(block.drop),
      type: block.type,
      en: block.text ?? null,
      enRows: block.rows ?? null,
      zh: pageOnly ? null : zhText,
      zhRows: tr?.rows ?? null,
      figs: figMap[i] ?? null,
    };
  });

  // (A)/(B)/(C) labels that the PDF text layer left as stray paragraphs now sit
  // next to the picture that already carries them.
  blocks.forEach((b, i) => {
    if (b.skip || b.type !== "p") return;
    if (!blocks[i + 1]?.figs) return;
    if (/^[A-H](?:[ ,]+[A-H])*$/.test((b.en ?? "").trim())) b.skip = true;
  });
  return { blocks, translated: Boolean(zh) };
}

export function coverage(slug) {
  const zh = readZh(slug);
  if (!zh) return 0;
  const source = JSON.parse(fs.readFileSync(path.join(dataDir, "source", `${slug}.json`), "utf8"));
  const filled = source.filter((b, i) => {
    if (b.drop) return true;
    const v = zh.get(i);
    if (b.type === "table") return Array.isArray(v?.rows) && v.rows.length === b.rows.length;
    return typeof v?.text === "string" && v.text.length > 0;
  }).length;
  return filled / source.length;
}

export function translatedChapters(chapters) {
  return chapters.filter((c) => coverage(c.slug) >= 1);
}

export function chapterShares(chapters) {
  const counts = chapters.map((c) => {
    const source = JSON.parse(
      fs.readFileSync(path.join(dataDir, "source", `${c.slug}.json`), "utf8"),
    );
    return source.filter((b) => !b.drop && b.type !== "figure").length;
  });
  const total = counts.reduce((a, b) => a + b, 0);
  const shares = new Map();
  let running = 0;
  chapters.forEach((c, i) => {
    shares.set(c.slug, { start: running / total, share: counts[i] / total });
    running += counts[i];
  });
  return shares;
}
