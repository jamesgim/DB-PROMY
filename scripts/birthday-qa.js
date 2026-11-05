import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { daysRemaining } from "../src/systems/stars.js";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
await fs.mkdir("test-results", { recursive: true });
const c = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
    serviceWorkers: "block",
  }),
  p = await c.newPage(),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
try {
  console.log("Browser ready");
  await p.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  console.log("World ready");
  await p.locator("#openStars").click();
  await p.selectOption("#birthMonth", "9");
  await p.selectOption("#birthDay", "10");
  await p.locator("#applyBirthday").click();
  assert.match(await p.locator("#zodiacName").innerText(), /처녀/);
  await p.locator("#zodiacName").click();
  console.log("Birthday set");
  for (let i = 0; i < 99; i++) await p.keyboard.press("2");
  assert.equal(await p.locator("#personalStarMessage").count(), 0);
  await p.keyboard.press("2");
  await p.waitForSelector("#personalStarMessage");
  const remaining = daysRemaining(
    await p.evaluate(() =>
      new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    ),
  );
  assert.ok(
    (await p.locator("#personalStarMessage").innerText()).includes(
      String(remaining),
    ),
  );
  const first = await p.locator("#personalStarMessage").innerText();
  assert.equal((await p.evaluate(() => window.__PROMY_QA__.journey)).stones, 0);
  assert.equal(
    (await p.evaluate(() => window.__PROMY_QA__.journey)).available,
    0,
  );
  await p.screenshot({ path: "test-results/birthday-100.png" });
  const download = p.waitForEvent("download");
  await p.locator("[data-star-download=portrait]").click();
  await (await download).saveAs("test-results/birthday-card-9x16.png");
  await p.locator("#zodiacName").click();
  for (let i = 0; i < 100; i++) await p.keyboard.press("2");
  assert.notEqual(await p.locator("#personalStarMessage").innerText(), first);
  await p.selectOption("#birthMonth", "12");
  await p.selectOption("#birthDay", "25");
  await p.locator("#applyBirthday").click();
  assert.match(await p.locator("#zodiacName").innerText(), /염소/);
  await p.locator("#personalStars [data-close]").click();
  await p.locator("#viewTowers").click();
  await p
    .locator("canvas")
    .first()
    .click({ position: { x: 20, y: 300 } });
  for (let i = 0; i < 100; i++) await p.keyboard.press("1");
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 100);
  await p.locator("#actPromise").click();
  assert.equal(
    await p.locator("#modal").evaluate((e) => e.parentElement.tagName),
    "BODY",
  );
  assert.equal(
    await p
      .locator(".world-tower-labels")
      .evaluate((e) => getComputedStyle(e).visibility),
    "hidden",
  );
  await p.screenshot({ path: "test-results/modal-layer-fixed.png" });
  await p.locator("#closeModal").click();
  await p.locator("#openGifts").click();
  await p.locator("#drawJourneyReward").click();
  await p.waitForSelector("#rewardResult img");
  const prize = await p.locator("#rewardResult img").getAttribute("src");
  await p.locator("#journeyRewards [data-close]").click();
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.stones === 100);
  await p.locator("#openStars").click();
  assert.match(await p.locator("#starVisitCount").innerText(), /200/);
  assert.match(await p.locator("#zodiacName").innerText(), /염소/);
  await p.locator("#personalStars [data-close]").click();
  await p.locator("#openGifts").click();
  assert.equal(await p.locator("#rewardResult img").getAttribute("src"), prize);
  await p.locator("#journeyRewards [data-close]").click();
  await p.goto("http://127.0.0.1:4173/world.html?qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.mode === "real");
  await p.locator("#openStars").click();
  assert.match(await p.locator("#starVisitCount").innerText(), /1/);
  await p.locator("#personalStars [data-close]").click();
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__);
  await p.locator("#openStars").click();
  assert.match(await p.locator("#starVisitCount").innerText(), /1/);
  assert.equal(await p.locator("#personalStarMessage").count(), 0);
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/birthday-qa.json",
    JSON.stringify(
      {
        passed: true,
        checks: [
          "birthday zodiac",
          "99 locked / 100 card",
          "calendar remaining days",
          "200 changed message",
          "no star draw tickets",
          "modal labels hidden",
          "gift and visit persistence",
          "refresh deduplication",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Birthday, 100/200 visits, no prizes, layers, gift persistence and refresh checks passed",
  );
} finally {
  await browser.close();
}
