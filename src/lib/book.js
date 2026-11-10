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
    const line = raw.trim();
    if (!line) continue;
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

export function loadChapter(slug) {
  const file = path.join(dataDir, "source", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const source = JSON.parse(fs.readFileSync(file, "utf8"));
  const zh = readZh(slug);
  const blocks = source.map((block, i) => {
    const tr = zh?.get(i) ?? null;
    return {
      i,
      type: block.type,
      en: block.text ?? null,
      enRows: block.rows ?? null,
      zh: tr?.text ?? null,
      zhRows: tr?.rows ?? null,
    };
  });
  return { blocks, translated: Boolean(zh) };
}

export function coverage(slug) {
  const zh = readZh(slug);
  if (!zh) return 0;
  const source = JSON.parse(fs.readFileSync(path.join(dataDir, "source", `${slug}.json`), "utf8"));
  const filled = source.filter((b, i) => {
    const v = zh.get(i);
    if (b.type === "table") return Array.isArray(v?.rows) && v.rows.length === b.rows.length;
    return typeof v?.text === "string" && v.text.length > 0;
  }).length;
  return filled / source.length;
}

export function translatedChapters(chapters) {
  return chapters.filter((c) => coverage(c.slug) >= 1);
}
