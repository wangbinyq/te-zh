const FONT_KEY = "pain-zh:font-size";
const EN_KEY = "pain-zh:show-en";
const SIZES = ["18px", "20px", "22px"];

function readFont() {
  try {
    const i = Number(localStorage.getItem(FONT_KEY));
    return Number.isInteger(i) && i >= 0 && i < SIZES.length ? i : 0;
  } catch {
    return 0;
  }
}

function readEn() {
  try {
    return localStorage.getItem(EN_KEY) === "1";
  } catch {
    return false;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function initSettings() {
  const dialog = document.getElementById("settings");
  const open = document.getElementById("open-settings");
  if (!dialog || !open) return;

  const seg = dialog.querySelector("#font-seg");
  const en = dialog.querySelector("#show-en");

  const paint = () => {
    document.documentElement.style.setProperty("--fs", SIZES[readFont()]);
    document.documentElement.classList.toggle("show-en", readEn());
    for (const button of seg.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.font) === readFont()));
    }
    en.checked = readEn();
  };

  paint();

  open.addEventListener("click", () => dialog.showModal());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  seg.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-font]");
    if (!button) return;
    write(FONT_KEY, button.dataset.font);
    paint();
  });

  en.addEventListener("change", () => {
    write(EN_KEY, en.checked ? "1" : "0");
    paint();
  });

  for (const close of dialog.querySelectorAll("[data-close]")) {
    close.addEventListener("click", () => dialog.close());
  }
}
