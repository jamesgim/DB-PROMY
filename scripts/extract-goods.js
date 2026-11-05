import fs from "node:fs/promises";
import { chromium } from "playwright";
const bytes = await fs.readFile("../private-inputs/goods-0.webp");
const browser = await chromium.launch({ headless: true });
try {
  const p = await browser.newPage();
  await p.setContent("<canvas></canvas>");
  const tiles = await p.evaluate(
    async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const xs = [4, 240, 465, 710, 955, 1198],
        ys = [64, 341, 585, 848, 1272],
        out = [];
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 5; col++) {
          const c = document.createElement("canvas");
          c.width = 320;
          c.height = 360;
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff4e7";
          ctx.fillRect(0, 0, 320, 360);
          const x = (xs[col] * img.width) / 1199,
            y = (ys[row] * img.height) / 1312,
            w = ((xs[col + 1] - xs[col]) * img.width) / 1199,
            h = ((ys[row + 1] - ys[row]) * img.height) / 1312,
            s = Math.min(320 / w, 360 / h);
          ctx.drawImage(
            img,
            x,
            y,
            w,
            h,
            (320 - w * s) / 2,
            (360 - h * s) / 2,
            w * s,
            h * s,
          );
          out.push(c.toDataURL("image/webp", 0.87).split(",")[1]);
        }
      return out;
    },
    "data:image/webp;base64," + bytes.toString("base64"),
  );
  await fs.mkdir("assets/goods", { recursive: true });
  for (let i = 0; i < tiles.length; i++)
    await fs.writeFile(
      "assets/goods/promy-" + String(i + 1).padStart(2, "0") + ".webp",
      Buffer.from(tiles[i], "base64"),
    );
  console.log(
    "Extracted",
    tiles.length,
    "authorized goods design tiles; private source HTML excluded",
  );
} finally {
  await browser.close();
}
