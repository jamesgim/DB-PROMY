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
    p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  await p.locator("#viewTowers").click();
  await p.waitForTimeout(2000);
  await p.locator("#openGifts").click();
  await p.waitForTimeout(200);
  const pose = await p.evaluate(() => window.__PROMY_QA__.camera);
  await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(() => window.__PROMY_QA__.camera), pose);
  await p.locator("#journeyRewards [data-close]").click();
  await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => window.__PROMY_QA__.view), "towers");
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal(await p.evaluate(() => window.__PROMY_QA__.view), "towers");
  await p.evaluate(async () => {
    const { store, currentClock } = await import("./src/systems/runtime.js");
    store.act("setBirthday", { month: 9, day: 10 }, currentClock());
    for (let i = 0; i < 100; i++) store.act("demoVisit", null, currentClock());
  });
  await p.locator("#openStars").click();
  await p.locator("#starMilestoneCard").scrollIntoViewIfNeeded();
  await p.screenshot({ path: "test-results/birthday-100-card.png" });
  await p.locator("#personalStars [data-close]").click();
  await p.locator("#actPromise").click();
  await p.screenshot({ path: "test-results/modal-layer-fixed.png" });
  await c.close();
  const mc = await b.newContext({
      serviceWorkers: "block",
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    m = await mc.newPage();
  m.on("pageerror", (e) => errors.push(e.message));
  await m.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await m.waitForFunction(() => window.__PROMY_QA__);
  await m.locator("#openStars").click();
  await m.selectOption("#birthMonth", "2");
  await m.selectOption("#birthDay", "29");
  await m.locator("#applyBirthday").click();
  assert.match(await m.locator("#zodiacName").innerText(), /물고기/);
  await m.locator("#zodiacName").click();
  await m.keyboard.press("2");
  assert.match(await m.locator("#starVisitCount").innerText(), /1/);
  assert.equal(
    await m
      .locator("#personalStars")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
    true,
  );
  await m.screenshot({ path: "test-results/birthday-mobile.png" });
  await mc.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/birthday-view-qa.json",
    JSON.stringify(
      {
        passed: true,
        cameraFrozenInGifts: true,
        cameraViewRestoredAfterReload: true,
        mobileBirthdayAndVisitButton: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Camera freeze, view restore and mobile birthday checks passed");
} finally {
  await b.close();
}
