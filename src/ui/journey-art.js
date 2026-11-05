import { copy } from "../data/copy.js";
const seal = new Image();
seal.src = new URL("../../assets/promy-seal.png", import.meta.url).href;
import { starPosition } from "../systems/journey.js";
export function paintStars(ctx, w, h, count, variant = 0) {
  let prev;
  for (let i = 0; i < count; i++) {
    const p = starPosition(i, variant),
      x = p.x * w,
      y = p.y * h;
    if (prev && i % 5) {
      ctx.strokeStyle = "#e5e6ad55";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(...prev);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffda91";
    ctx.beginPath();
    ctx.arc(x, y, i === count - 1 ? 4 : 2.2, 0, 7);
    ctx.fill();
    prev = [x, y];
  }
}
export function paintTowers(ctx, x, y, w, h, slots) {
  for (let tower = 0; tower < 3; tower++) {
    const cx = x + (w * (tower + 0.5)) / 3;
    ctx.fillStyle = "#17543c";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.88, w * 0.12, h * 0.055, 0, 0, 7);
    ctx.fill();
    const scale = slots[tower] === 100 ? 0.4 : 1;
    for (let i = 0; i < slots[tower]; i++) {
      const level = Math.floor(i / 5),
        side = i % 5,
        taper = 1 - level * 0.032;
      const sx =
          cx +
          Math.cos((side * Math.PI * 2) / 5 + level * 0.46) *
            w *
            0.06 *
            taper *
            scale,
        sy = y + h * 0.85 - level * h * 0.036 * scale;
      ctx.fillStyle =
        i === 99 ? "#ffda91" : ["#c2c4b0", "#a4b09e", "#d6d0bb"][i % 3];
      ctx.beginPath();
      ctx.ellipse(
        sx,
        sy,
        w * 0.033 * taper * scale,
        h * 0.019 * scale,
        side * 0.1,
        0,
        7,
      );
      ctx.fill();
    }
    if (slots[tower] === 100) {
      const top = y + h * 0.85 - 19 * h * 0.036 * 0.4;
      ctx.textAlign = "center";
      ctx.fillStyle = "#eff4db";
      ctx.font = "bold " + Math.round(h * 0.075) + "px system-ui";
      ctx.fillText(copy("tower.promise"), cx, top - 5);
      if (seal.complete && seal.naturalWidth)
        ctx.drawImage(seal, cx - h * 0.07, top - h * 0.24, h * 0.14, h * 0.16);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#eaf5dc";
    ctx.font = "600 " + Math.round(h * 0.095) + "px system-ui";
    ctx.fillText(slots[tower] + "/100", cx, y + h);
  }
}
