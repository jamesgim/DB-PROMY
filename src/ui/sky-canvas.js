import { store, currentClock } from "../systems/runtime.js";
import { copy } from "../data/copy.js";
import { constellationLines, skyBirthdays } from "../systems/stars.js";
export function openSkyCanvas() {
  if (document.getElementById("skyCanvasDialog")?.open) return;
  document.getElementById("skyCanvasDialog")?.remove();
  const d = document.createElement("dialog");
  d.id = "skyCanvasDialog";
  d.className = "share-dialog";
  const h = document.createElement("h2");
  h.textContent = copy("sky.view");
  const note = document.createElement("p");
  note.textContent = copy("sky.info");
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 640;
  canvas.style.width = "100%";
  const close = document.createElement("button");
  close.textContent = copy("sky.back");
  close.onclick = () => d.close();
  d.append(h, note, canvas, close);
  document.body.append(d);
  function draw() {
    const births = skyBirthdays(store.state.personalStars.skyCount),
      latest = births.at(-1);
    note.textContent =
      copy("sky.info") +
      (latest
        ? " · " +
          copy("sky.birthdayAdded")
            .replace("{month}", latest.month)
            .replace("{day}", latest.day)
            .replace("{n}", births.length)
        : "");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#091c31";
    ctx.fillRect(0, 0, 1000, 640);
    function signAt(sign, visits, cx, cy, size, color) {
      const reveal = constellationLines(sign, visits),
        point = ([x, y]) => [cx + (x - 0.5) * size, cy + (y - 0.5) * size];
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      for (const edge of reveal.edges) {
        ctx.beginPath();
        ctx.moveTo(...point(edge[0]));
        ctx.lineTo(...point(edge[1]));
        ctx.stroke();
      }
      for (const p of reveal.points) {
        ctx.beginPath();
        ctx.arc(...point(p), size > 100 ? 4 : 1.4, 0, 7);
        ctx.fill();
      }
    }
    const own = store.stars(currentClock());
    signAt(own.sign, own.visits, 500, 320, 200, "#ffe1a1");
    skyBirthdays(store.state.personalStars.skyCount).forEach(({ sign }, i) => {
      const a = i * 2.399963,
        r = 150 + Math.sqrt(i / 365) * 290;
      signAt(
        sign,
        100,
        500 + Math.cos(a) * r,
        320 + Math.sin(a) * r * 0.62,
        26,
        "#8cbdca",
      );
    });
  }
  const unsub = store.subscribe(draw);
  d.addEventListener("close", unsub, { once: true });
  draw();
  d.showModal();
}
