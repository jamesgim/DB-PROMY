import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const b = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const p = await b.newPage({
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal(
    await p.evaluate(() => window.__PROMY_QA__.journey.mode),
    "real",
  );
  await p.keyboard.press("8");
  await p.waitForFunction(
    () =>
      window.__PROMY_QA__.sky.neighbors === 1 &&
      window.__PROMY_QA__.view === "stars",
  );
  assert.match(await p.locator(".sky-toolbar").innerText(), /1월 1일생/);
  await p.screenshot({ path: "test-results/sky-key8-jan01.png" });
  await p.keyboard.press("8");
  await p.waitForFunction(() => window.__PROMY_QA__.sky.neighbors === 2);
  assert.match(await p.locator(".sky-toolbar").innerText(), /1월 2일생/);
  const yaw = await p.evaluate(() => window.__PROMY_QA__.skyYaw);
  assert.ok(Math.abs(yaw - 2.399963) < 0.001);
  await p.screenshot({ path: "test-results/sky-key8-jan02.png" });
  const rect = await p.locator("#viewport canvas").boundingBox();
  await p.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.6);
  await p.mouse.down();
  await p.mouse.move(rect.x + rect.width * 0.75, rect.y + rect.height * 0.6, {
    steps: 10,
  });
  await p.mouse.up();
  await p.waitForTimeout(150);
  assert.notEqual(await p.evaluate(() => window.__PROMY_QA__.skyYaw), yaw);
  await p.keyboard.press("7");
  await p.waitForFunction(() => window.__PROMY_QA__.sky.neighbors === 0);
  await p.keyboard.press("8");
  await p.waitForFunction(() => window.__PROMY_QA__.sky.neighbors === 1);
  assert.match(await p.locator(".sky-toolbar").innerText(), /1월 1일생/);
  await p.getByRole("button", { name: "동네로 돌아가기", exact: true }).click();
  await p.goto("http://127.0.0.1:4173/world.html");
  await p.waitForSelector("#loading", { state: "hidden" });
  await p.keyboard.press("7");
  await p.keyboard.press("8");
  await p.waitForSelector(".sky-toolbar:not([hidden])");
  assert.match(await p.locator(".sky-toolbar").innerText(), /1월 1일생/);
  await p.keyboard.press("8");
  assert.match(await p.locator(".sky-toolbar").innerText(), /1월 2일생/);
  await p.close();
  const f = await b.newPage({ serviceWorkers: "block" });
  await f.goto("http://127.0.0.1:4173/fallback.html");
  await f.keyboard.press("8");
  await f.waitForSelector("#skyCanvasDialog[open]");
  assert.match(await f.locator("#skyCanvasDialog").innerText(), /1월 1일생/);
  await f.keyboard.press("8");
  assert.match(await f.locator("#skyCanvasDialog").innerText(), /1월 2일생/);
  await f.keyboard.press("7");
  await f.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/sky-keyboard-360-qa.json",
    JSON.stringify(
      {
        passed: true,
        plainWorldUrl: true,
        noDemoFlag: true,
        key8Jan1Jan2: true,
        autoSkyAndFocus: true,
        drag360: true,
        key7ThenJan1: true,
        fallback: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Plain URL + real mode: 8 Jan1 -> 8 Jan2, automatic sky focus, drag panorama, 7 reset and fallback passed",
  );
} finally {
  await b.close();
}
