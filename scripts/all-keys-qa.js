import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const b = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const c = await b.newContext({
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  const progress = () =>
    p.evaluate(async () => {
      const { store } = await import("./src/systems/runtime.js");
      return {
        stones: store.journey().stones,
        visits: store.stars().visits,
        sky: store.state.personalStars.skyCount,
        mode: store.demonstration,
        realStones: store.state.journey.placedDays.length,
        realVisits: store.state.personalStars.real.count,
      };
    });
  const original = await progress();
  assert.equal(original.mode, false);
  await p.keyboard.press("1");
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 1);
  await p.keyboard.press("1");
  assert.equal((await progress()).stones, 2);
  await p.keyboard.press("2");
  await p.keyboard.press("2");
  assert.equal((await progress()).visits, 2);
  await p.keyboard.press("9");
  assert.equal((await progress()).visits, 0);
  assert.equal((await progress()).stones, 2);
  await p.keyboard.press("0");
  assert.equal((await progress()).stones, 0);
  await p.keyboard.press("8");
  assert.equal((await progress()).sky, 1);
  await p.keyboard.press("8");
  assert.equal((await progress()).sky, 2);
  await p.keyboard.press("7");
  assert.equal((await progress()).sky, 0);
  await p.keyboard.press("1");
  assert.equal((await progress()).stones, 1);
  await p.waitForFunction(() => window.__PROMY_QA__.view === "towers");
  await p.locator("#openGifts").click();
  await p.keyboard.press("1");
  assert.equal((await progress()).stones, 2);
  assert.equal(await p.locator("#journeyRewards").isVisible(), false);
  await p.keyboard.press("Numpad1");
  assert.equal((await progress()).stones, 3);
  await p.keyboard.press("Numpad2");
  assert.equal((await progress()).visits, 1);
  await p.keyboard.press("Numpad9");
  assert.equal((await progress()).visits, 0);
  await p.keyboard.press("Numpad0");
  assert.equal((await progress()).stones, 0);
  await p.keyboard.press("Numpad8");
  assert.equal((await progress()).sky, 1);
  await p.keyboard.press("Numpad7");
  assert.equal((await progress()).sky, 0);
  await p.keyboard.press("1");
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal((await progress()).mode, true);
  assert.equal((await progress()).stones, 1);
  await p.goto("http://127.0.0.1:4173/world.html");
  await p.waitForSelector("#loading", { state: "hidden" });
  await p.keyboard.press("1");
  assert.equal((await progress()).stones, 2);
  await p.locator("#openStars").click();
  await p.locator("#birthMonth").focus();
  const beforeInput = await progress();
  await p.keyboard.press("2");
  await p.keyboard.press("9");
  assert.equal((await progress()).visits, beforeInput.visits);
  await p.locator("#personalStars [data-close]").click();
  assert.equal((await progress()).realStones, original.realStones);
  assert.equal((await progress()).realVisits, original.realVisits);
  await p.screenshot({ path: "test-results/all-keys-working.png" });
  await c.close();
  const f = await b.newPage({ serviceWorkers: "block" });
  await f.goto("http://127.0.0.1:4173/fallback.html");
  await f.keyboard.press("1");
  assert.equal(await f.locator("#dailyTotal").innerText(), "1");
  await f.keyboard.press("2");
  assert.equal(
    await f.evaluate(
      async () =>
        (await import("./src/systems/runtime.js")).store.stars().visits,
    ),
    1,
  );
  await f.keyboard.press("0");
  assert.equal(await f.locator("#dailyTotal").innerText(), "0");
  await f.keyboard.press("9");
  await f.keyboard.press("8");
  await f.waitForSelector("#skyCanvasDialog[open]");
  await f.keyboard.press("7");
  await f.close();
  const s = await b.newPage({ serviceWorkers: "block" });
  await s.goto("http://127.0.0.1:4173/world.html?spectate=1&qa=1");
  await s.waitForFunction(() => window.__PROMY_QA__);
  for (const key of ["0", "1", "2", "7", "8", "9"]) await s.keyboard.press(key);
  assert.equal(
    await s.evaluate(
      async () =>
        (await import("./src/systems/runtime.js")).store.demonstration,
    ),
    false,
  );
  assert.equal(await s.evaluate(() => window.__PROMY_QA__.journey.stones), 0);
  await s.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/all-keys-qa.json",
    JSON.stringify(
      {
        passed: true,
        plainUrl: true,
        keys: ["0", "1", "2", "7", "8", "9"],
        numpad: true,
        fromGiftsAndSky: true,
        reloadModeAndProgress: true,
        realRecordsPreserved: true,
        inputGuard: true,
        spectatorGuard: true,
        fallback: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "All six keys + numpad, plain URL, modal/sky, reload, real isolation, input/spectator guards and 2D passed",
  );
} finally {
  await b.close();
}
