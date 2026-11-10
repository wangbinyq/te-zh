const KEY = "pain-zh:progress:v1";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function put(slug, entry) {
  const all = readAll();
  all[slug] = { ...entry, at: Date.now() };
  writeAll(all);
}

export function get(slug) {
  return readAll()[slug] ?? null;
}

export function latest() {
  const all = readAll();
  return Object.entries(all)
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.at - a.at)[0] ?? null;
}

export function ago(ts) {
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}

export function label(num, title) {
  return num ? `第 ${num} 章 · ${title}` : title;
}
