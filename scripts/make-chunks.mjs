import fs from "node:fs";
import path from "node:path";
import { chapters } from "../src/data/chapters.js";

const LIMIT = Number(process.argv[2] ?? 8000);
const outDir = process.argv[3] ?? "/tmp/te_chunks";
fs.mkdirSync(outDir, { recursive: true });

const manifest = [];

for (const chapter of chapters) {
  const blocks = JSON.parse(
    fs.readFileSync(path.join("src/data/source", `${chapter.slug}.json`), "utf8"),
  );
  const words = (b) =>
    b.text ? b.text.split(/\s+/).length : b.rows.flat().join(" ").split(/\s+/).length;

  const parts = [];
  let current = [];
  let size = 0;
  blocks.forEach((b, i) => {
    const w = words(b);
    if (current.length && size + w > LIMIT) {
      parts.push(current);
      current = [];
      size = 0;
    }
    current.push({ block: b, i });
    size += w;
  });
  if (current.length) parts.push(current);

  parts.forEach((part, k) => {
    const lines = [];
    for (const { block, i } of part) {
      if (block.type === "table") {
        lines.push(`@@ ${i} [table]`);
        for (const row of block.rows) lines.push(row.join(" | "));
      } else {
        lines.push(`@@ ${i} [${block.type}]`);
        lines.push(block.text);
      }
      lines.push("");
    }
    const name = `${chapter.slug}-p${k + 1}`;
    fs.writeFileSync(path.join(outDir, `${name}.txt`), lines.join("\n"));
    const w = part.reduce((sum, p) => sum + words(p.block), 0);
    manifest.push({ name, slug: chapter.slug, part: k + 1, blocks: part.length, words: w, first: part[0].i, last: part[part.length - 1].i });
  });
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
const total = manifest.reduce((s, m) => s + m.words, 0);
console.log(`${manifest.length} parts, ${total} words`);
const big = manifest.filter((m) => m.words > LIMIT * 1.2);
if (big.length) console.log("oversized:", big.map((m) => `${m.name}:${m.words}`).join(", "));
