import fs from "node:fs";
import path from "node:path";
import { chapters } from "../src/data/chapters.js";

function parts(slug) {
  const dir = "src/data/zh";
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f === `${slug}.txt` || f.startsWith(`${slug}.part`))
    .sort();
}

function parse(file) {
  const map = new Map();
  let current = null;
  let rows = null;
  const flush = () => {
    if (current !== null && rows) map.set(current, rows);
  };
  for (const raw of fs.readFileSync(path.join("src/data/zh", file), "utf8").split("\n")) {
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
    else map.set(current, line);
  }
  flush();
  return map;
}

let failed = false;
for (const chapter of chapters) {
  const files = parts(chapter.slug);
  const source = JSON.parse(fs.readFileSync(`src/data/source/${chapter.slug}.json`, "utf8"));
  if (!files.length) {
    console.log(`pending  ${chapter.slug}  (${source.length} blocks)`);
    continue;
  }
  const map = new Map();
  for (const f of files) for (const [k, v] of parse(f)) map.set(k, v);

  const problems = [];
  let chars = 0;
  source.forEach((block, i) => {
    const v = map.get(i);
    if (v === undefined || v === null) {
      problems.push(`missing ${i}`);
      return;
    }
    if (block.type === "table") {
      if (!Array.isArray(v)) {
        problems.push(`table ${i} not a table`);
        return;
      }
      if (v.length !== block.rows.length) problems.push(`table ${i} rows ${v.length}/${block.rows.length}`);
      const badCols = v.findIndex((r, k) => block.rows[k] && r.length !== block.rows[k].length);
      if (badCols !== -1) problems.push(`table ${i} row ${badCols} cols`);
      chars += v.flat().join("").length;
    } else {
      if (Array.isArray(v)) problems.push(`text ${i} parsed as table`);
      chars += String(v).length;
    }
  });

  if (problems.length) {
    console.error(`FAIL     ${chapter.slug}  ${problems.slice(0, 6).join("; ")}${problems.length > 6 ? ` …+${problems.length - 6}` : ""}`);
    failed = true;
  } else {
    console.log(`ok       ${chapter.slug}  ${source.length} blocks  ${chars} chars  (${files.length} part files)`);
  }
}

if (failed) {
  console.error("\ncheck failed");
  process.exit(1);
}
console.log("\nall translated chapters aligned");
