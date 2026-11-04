import { paintStars, paintTowers } from "./journey-art.js";
import { copy } from "../data/copy.js";
import { store, currentClock, data } from "../systems/runtime.js";
import { DAY, weekKey } from "../systems/clock.js";
let capture = null;
let videoSource = null;
export function setCapture(fn) {
  capture = fn;
}
export function setVideoSource(fn) {
  videoSource = fn;
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const png = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(Error("PNG"))), "image/png"),
  );
const canvas = (w, h) =>
  Object.assign(document.createElement("canvas"), { width: w, height: h });
function base(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#205947");
  g.addColorStop(1, "#081e29");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.fillStyle = "#eef5df";
}
function text(ctx, s, x, y, size = 34, color = "#eef5df") {
  ctx.fillStyle = color;
  ctx.font = "600 " + size + "px system-ui";
  ctx.fillText(s, x, y);
}
function sky(ctx, w, h, count, progress = 1) {
  const n = Math.min(300, count);
  ctx.strokeStyle = "#dcecab44";
  ctx.lineWidth = 2;
  let prev;
  for (let i = 0; i < Math.ceil(n * progress); i++) {
    const x = w * (0.1 + (((i * 73 + 29) % 199) / 199) * 0.8),
      y = h * (0.2 + (((i * 41 + 11) % 137) / 137) * 0.4);
    if (prev && i % 5) {
      ctx.beginPath();
      ctx.moveTo(...prev);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffdf9e";
    ctx.beginPath();
    ctx.arc(x, y, i % 4 === 0 ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
    prev = [x, y];
  }
}
function publicURL() {
  const url = new URL(
    location.hostname === "127.0.0.1" || location.hostname === "localhost"
      ? "https://jamesgim.github.io/DB-PROMY/world.html"
      : new URL("../../world.html", import.meta.url),
  );
  url.search = "?src=story";
  return url.href;
}
async function makeCard(w, h, avatar) {
  const c = canvas(w, h),
    ctx = c.getContext("2d"),
    s = store.summary(currentClock()),
    progress = store.journey(currentClock());
  base(ctx, w, h);
  paintStars(ctx, w, h * 0.65, progress.stars, store.state.variant);
  text(ctx, copy("text.061"), w / 2, 95, 40);
  text(
    ctx,
    currentClock().day +
      (progress.mode === "demo" ? " · " + copy("journey.demoResult") : ""),
    w / 2,
    150,
    25,
    "#b9d8bf",
  );
  if (avatar) {
    const size = h > 1200 ? 660 : 330;
    ctx.drawImage(avatar, (w - size) / 2, h * 0.18, size, size);
  } else {
    text(ctx, "✦", w / 2, h * 0.42, 160, "#ffd99a");
  }
  const y = h > 1200 ? h * 0.78 : 780;
  paintTowers(
    ctx,
    140,
    h > 1200 ? h * 0.58 : 560,
    w - 280,
    h > 1200 ? 230 : 130,
    progress.slots,
  );
  const chosen = data.care.find((x) => x.id === s.letter?.id);
  text(
    ctx,
    s.letter?.done && chosen
      ? copy("share.today") + chosen.title
      : copy("care.dailyRecord"),
    w / 2,
    y - 60,
    30,
  );
  text(
    ctx,
    copy("journey.badge")
      .replaceAll("{n}", progress.stones)
      .replace("{t}", progress.towers),
    w / 2,
    y,
    33,
  );
  text(
    ctx,
    copy("journey.goal")
      .replace("{n}", progress.stones)
      .replace("{t}", progress.towers)
      .replace("{s}", progress.stars),
    w / 2,
    y + 65,
    44,
    "#e4f6a7",
  );
  text(ctx, copy("text.066"), w / 2, y + 126, 37);
  text(ctx, copy("text.067"), w / 2, h - 150, 23, "#b5cfbe");
  text(ctx, data.brand.slogan, w / 2, h - 105, 28);
  text(ctx, copy("text.068"), w / 2, h - 65, 20, "#b5cfbe");
  text(ctx, publicURL(), w / 2, h - 27, 16, "#b5cfbe");
  store.act("generated");
  return {
    blob: await png(c),
    name: "promy-" + w + "x" + h + ".png",
    canvas: c,
  };
}
export async function openShare() {
  let dialog = document.querySelector(".share-dialog");
  if (dialog) dialog.remove();
  dialog = document.createElement("dialog");
  dialog.className = "share-dialog";
  dialog.innerHTML = copy("text.069");
  document.body.append(dialog);
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.showModal();
  try {
    const avatar = capture?.();
    const cards = await Promise.all([
      makeCard(1080, 1920, avatar),
      makeCard(1080, 1080, avatar),
    ]);
    dialog.querySelector("p").textContent = copy("text.070");
    const img = document.createElement("img");
    img.alt = copy("text.071");
    const previewURL = URL.createObjectURL(cards[0].blob);
    img.src = previewURL;
    dialog.prepend(img);
    dialog.addEventListener("close", () => URL.revokeObjectURL(previewURL), {
      once: true,
    });
    for (const card of cards) {
      const b = document.createElement("button");
      b.textContent =
        card.canvas.height === 1920 ? copy("text.072") : copy("text.073");
      b.onclick = () => download(card.blob, card.name);
      dialog.append(b);
    }
    for (const [index, key] of [
      [0, "share.story"],
      [1, "share.feed"],
    ]) {
      const share = document.createElement("button");
      share.textContent = copy(key);
      share.dataset.instagram = index === 0 ? "story" : "feed";
      share.onclick = async () => {
        const card = cards[index],
          files = [new File([card.blob], card.name, { type: "image/png" })];
        store.act("shareClicks");
        if (
          typeof navigator.share === "function" &&
          navigator.canShare?.({ files })
        ) {
          dialog.querySelector("p").textContent = copy("share.guide");
          try {
            await navigator.share({ files });
            dialog.querySelector("p").textContent = copy("share.handed");
          } catch (e) {
            dialog.querySelector("p").textContent = copy(
              e.name === "AbortError" ? "share.cancelled" : "share.manual",
            );
          }
        } else dialog.querySelector("p").textContent = copy("share.manual");
      };
      dialog.append(share);
    }
    const caption = document.createElement("button");
    caption.textContent = copy("share.caption");
    caption.onclick = async () => {
      try {
        await navigator.clipboard.writeText(
          copy("share.captionText").replace(
            "{n}",
            store.summary(currentClock()).total,
          ),
        );
        dialog.querySelector("p").textContent = copy("share.copied");
      } catch {
        dialog.querySelector("p").textContent = copy("share.copyFailed");
      }
    };
    dialog.append(caption);
    const instagram = document.createElement("a");
    instagram.textContent = copy("share.open");
    instagram.href = "https://www.instagram.com/";
    instagram.target = "_blank";
    instagram.rel = "noopener noreferrer";
    instagram.className = "instagram-open";
    dialog.append(instagram);
  } catch {
    dialog.querySelector("p").textContent = copy("text.077");
  }
}
export async function exportEditorial() {
  const today = currentClock().day,
    yesterday = new Date(Date.parse(today) - DAY).toISOString().slice(0, 10);
  const monday = weekKey(today),
    start = new Date(Date.parse(monday) - 7 * DAY).toISOString().slice(0, 10);
  const events = store.state.events.filter(
    (e) => e.day >= start && e.day < monday,
  );
  const category = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    count: events.filter((e) => e.type === "promise" && e.category === i)
      .length,
  })).sort((a, b) => b.count - a.count)[0];
  const queue = {
    version: 1,
    status: "requires-human-review",
    scope: "this-browser-only",
    realPresencePeak: null,
    day: yesterday,
    localCheckins: store.state.days[yesterday]?.length ? 1 : 0,
    localStars: store.state.events.filter(
      (e) => e.day === yesterday && e.type === "star",
    ).length,
    week: {
      start,
      end: monday,
      promises: events.filter((e) => e.type === "promise").length,
      topCategory: category.count ? category.id : null,
    },
    aiGenerated: true,
    autoPublished: false,
  };
  const titles = [
    copy("text.078") + yesterday,
    copy("text.079") + queue.week.promises + copy("text.080"),
    category.count
      ? copy("text.081") + data.categories[category.id].name
      : copy("text.082"),
    copy("text.083"),
  ];
  for (let i = 0; i < titles.length; i++) {
    const c = canvas(1080, 1350),
      ctx = c.getContext("2d");
    base(ctx, 1080, 1350);
    sky(ctx, 1080, 1350, queue.localStars + 8);
    text(ctx, copy("text.084"), 540, 110, 40);
    text(ctx, titles[i], 540, 750, 38);
    text(ctx, copy("text.085"), 540, 880, 30);
    text(ctx, data.brand.slogan, 540, 1040, 32);
    text(ctx, copy("text.086"), 540, 1250, 24);
    download(await png(c), "promy-review-" + i + ".png");
  }
  download(
    new Blob([JSON.stringify(queue, null, 2)], { type: "application/json" }),
    "promy-approval-queue.json",
  );
}
export async function recordTimelapse() {
  if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)
    throw Error("unsupported");
  const c = canvas(540, 960),
    ctx = c.getContext("2d");
  const stream = c.captureStream(30),
    type = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find((x) => MediaRecorder.isTypeSupported(x));
  if (!type) throw Error("unsupported");
  const recorder = new MediaRecorder(stream, {
      mimeType: type,
      videoBitsPerSecond: 1800000,
    }),
    chunks = [];
  const s = store.summary(currentClock());
  s.stars =
    store.state.events.filter(
      (e) => e.day === currentClock().day && e.type === "star",
    ).length + (s.flags.includes("home") ? 1 : 0);
  const snapshot = capture?.();
  const worldVideo = videoSource?.();
  let cancelled = false;
  const dialog = document.createElement("dialog");
  dialog.className = "share-dialog";
  dialog.innerHTML = copy("text.087");
  document.body.append(dialog);
  dialog.querySelector("button").onclick = () => {
    cancelled = true;
    if (recorder.state !== "inactive") recorder.stop();
  };
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    dialog.querySelector("button").click();
  });
  dialog.showModal();
  try {
    await new Promise((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onerror = reject;
      recorder.onstop = resolve;
      recorder.start(1000);
      const start = performance.now();
      function frame() {
        if (cancelled) return;
        const t = (performance.now() - start) / 1000;
        base(ctx, 540, 960);
        if (worldVideo) ctx.drawImage(worldVideo.frame(t), 0, 0);
        sky(ctx, 540, 960, s.stars, Math.min(1, t / 27));
        if (!worldVideo && snapshot && t < 12) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - t / 12);
          ctx.drawImage(snapshot, 30, 240 - t * 12, 480, 480);
          ctx.restore();
        }
        text(ctx, copy("text.088"), 270, 80, 25);
        text(
          ctx,
          t >= 27
            ? copy("text.089") +
                s.stars +
                copy("text.090") +
                s.total +
                copy("text.030")
            : copy("text.091"),
          270,
          740,
          25,
        );
        text(ctx, data.brand.slogan, 270, 810, 21);
        text(ctx, copy("text.092"), 270, 860, 18);
        text(ctx, copy("text.093"), 440, 925, 14);
        dialog.querySelector("p").textContent =
          copy("text.094") + Math.min(30, Math.floor(t)) + copy("text.095");
        if (t >= 30) recorder.stop();
        else requestAnimationFrame(frame);
      }
      frame();
    });
    if (!cancelled) download(new Blob(chunks, { type }), "promy-sky-30s.webm");
  } finally {
    worldVideo?.dispose();
    stream.getTracks().forEach((t) => t.stop());
    dialog.close();
    dialog.remove();
  }
}
