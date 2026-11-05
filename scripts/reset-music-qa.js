import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const c = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  await p.evaluate(async () => {
    const { store, currentClock } = await import("./src/systems/runtime.js");
    store.act("setBirthday", { month: 9, day: 10 }, currentClock());
    for (let i = 0; i < 100; i++) {
      store.act("demoStone", null, currentClock());
      store.act("demoVisit", null, currentClock());
    }
  });
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 100);
  await p.keyboard.press("0");
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 0);
  assert.equal(await p.evaluate(() => window.__PROMY_QA__.journey.visits), 100);
  assert.equal(
    await p.evaluate(() => window.__PROMY_QA__.journey.available),
    0,
  );
  await p.locator("#openStars").click();
  assert.equal(await p.locator("#personalStarMessage").count(), 1);
  await p.locator("#zodiacName").click();
  await p.keyboard.press("9");
  assert.equal(await p.locator("#personalStarMessage").count(), 0);
  assert.match(await p.locator("#starVisitCount").innerText(), /0/);
  assert.match(await p.locator("#zodiacName").innerText(), /처녀/);
  await p.locator("#personalStars [data-close]").click();
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal(await p.evaluate(() => window.__PROMY_QA__.journey.stones), 0);
  assert.equal(await p.evaluate(() => window.__PROMY_QA__.journey.visits), 0);
  await p.locator("#viewTowers").click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: "test-results/reset-zero.png" });
  await p.locator("#soundBtn").click();
  await p.waitForFunction(() => {
    const a = document.querySelector("#promyBgm");
    return !a.paused && a.currentTime > 0;
  });
  assert.equal(await p.locator("#promyBgm").evaluate((a) => a.loop), true);
  assert.equal(
    await p.locator("#soundBtn").getAttribute("aria-pressed"),
    "true",
  );
  await p.locator("#promyBgm").evaluate((a) => {
    a.currentTime = a.duration - 0.3;
  });
  await p.waitForFunction(
    () => document.querySelector("#promyBgm").currentTime < 3,
  );
  await p.locator("#openGifts").click();
  assert.equal(await p.locator("#promyBgm").evaluate((a) => a.paused), false);
  await p.locator("#journeyRewards [data-close]").click();
  await p.locator("#soundBtn").click();
  assert.equal(await p.locator("#promyBgm").evaluate((a) => a.paused), true);
  await p.locator("#soundBtn").click();
  await p.waitForFunction(() => !document.querySelector("#promyBgm").paused);
  await p.screenshot({ path: "test-results/music-loop.png" });
  await c.close();
  const f = await browser.newPage({ serviceWorkers: "block" });
  await f.goto("http://127.0.0.1:4173/fallback.html?demo=1");
  await f.locator("#soundBtn").click();
  await f.waitForFunction(() => !document.querySelector("#promyBgm").paused);
  await f.keyboard.press("1");
  await f.waitForFunction(
    () => document.querySelector("#dailyTotal").textContent === "1",
  );
  await f.keyboard.press("0");
  await f.waitForFunction(
    () => document.querySelector("#dailyTotal").textContent === "0",
  );
  await f.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/reset-music-qa.json",
    JSON.stringify(
      {
        passed: true,
        key0: true,
        key9: true,
        independentResets: true,
        reloadZero: true,
        birthdayKept: true,
        mp3Playback: true,
        actualLoopWrap: true,
        pauseResume: true,
        fallback: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "0/9 independent resets, saved zero, MP3 playback / actual loop wrap / pause resume and 2D passed",
  );
} finally {
  await browser.close();
}
