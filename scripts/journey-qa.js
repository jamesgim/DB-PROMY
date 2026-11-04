import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
await fs.mkdir("test-results", { recursive: true });
try {
  const c = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto("http://127.0.0.1:4173/world.html?qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  await p.locator("[data-care=meal]").click();
  await p.locator("#completeCare").click();
  assert.equal(await p.locator("#dailyTotal").textContent(), "0");
  await p.locator("#placeStone").click();
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 1);
  assert.equal(await p.locator("#placeStone").isDisabled(), true);
  await p.keyboard.press("1");
  assert.equal(await p.locator("#dailyTotal").textContent(), "1");
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.stones === 1);
  console.log("Real promise, single daily stone and reload passed");
  await p.locator("#switchJourneyMode").click();
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.mode === "demo");
  assert.equal(await p.locator("#dailyTotal").textContent(), "0");
  await p.locator("#viewTowers").click();
  for (let i = 0; i < 100; i++) await p.keyboard.press("1");
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.stones === 100);
  assert.deepEqual(
    await p.evaluate(() => window.__PROMY_QA__.journey.slots),
    [100, 0, 0],
  );
  await p.locator("#openGifts").click();
  assert.equal(await p.locator(".goods-grid figure").count(), 20);
  await p.locator("#drawJourneyReward").click();
  await p.waitForSelector("#rewardResult img");
  const prize = await p.locator("#rewardResult img").getAttribute("src");
  assert.match(prize, /assets\/goods\/promy-\d{2}\.webp/);
  assert.equal(
    await p
      .getByRole("button", { name: "배송 접수 준비 중", exact: true })
      .isDisabled(),
    true,
  );
  await p.screenshot({ path: "test-results/journey-gift.png" });
  await p.locator("#journeyRewards [data-close]").click();
  await p.locator("#viewTowers").click();
  await p.waitForTimeout(1000);
  await p.screenshot({ path: "test-results/journey-100.png" });
  console.log("100 stones, actual key 1 and goods draw passed", prize);
  await p.keyboard.press("1");
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 101);
  assert.deepEqual(
    await p.evaluate(() => window.__PROMY_QA__.journey.slots),
    [100, 1, 0],
  );
  for (let i = 101; i < 300; i++) await p.keyboard.press("1");
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 300);
  assert.deepEqual(
    await p.evaluate(() => window.__PROMY_QA__.journey.slots),
    [100, 100, 100],
  );
  await p.keyboard.press("1");
  assert.equal(await p.locator("#dailyTotal").textContent(), "300");
  await p.waitForTimeout(900);
  await p.screenshot({ path: "test-results/journey-300.png" });
  const perf = await p.evaluate(() => window.__PROMY_QA__);
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.stones === 300);
  await p.locator("#openGifts").click();
  await p.waitForSelector("#rewardResult img");
  assert.equal(await p.locator("#rewardResult img").getAttribute("src"), prize);
  await p.locator("#journeyRewards [data-close]").click();
  await p.locator("#openStars").click();
  await p.screenshot({ path: "test-results/journey-stars.png" });
  await p.locator("#personalStars [data-close]").click();
  await p.locator("#switchJourneyMode").click();
  await p.waitForFunction(() => window.__PROMY_QA__?.journey.mode === "real");
  assert.equal(await p.locator("#dailyTotal").textContent(), "1");
  await p.locator("#shareDaily").click();
  await p.waitForSelector(".share-dialog img");
  const dl = p.waitForEvent("download");
  await p.getByRole("button", { name: "9:16 저장", exact: true }).click();
  await (await dl).saveAs("test-results/journey-share.png");
  await c.close();
  console.log("300 stones, independent birthday stars, persistence and real/demo isolation passed");
  const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    m = await mobile.newPage();
  m.on("pageerror", (e) => errors.push(e.message));
  await m.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await m.waitForFunction(() => window.__PROMY_QA__);
  await m.locator("#placeStone").click();
  assert.equal(await m.locator("#dailyTotal").textContent(), "1");
  await m.screenshot({ path: "test-results/journey-mobile.png" });
  await mobile.close();
  const fallback = await browser.newPage();
  await fallback.goto("http://127.0.0.1:4173/fallback.html?demo=1");
  await fallback.locator("#placeStone").click();
  assert.equal(await fallback.locator("#dailyTotal").textContent(), "1");
  await fallback.screenshot({ path: "test-results/journey-fallback.png" });
  await fallback.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/journey-report.json",
    JSON.stringify(
      {
        realDailyLimit: true,
        demoKey1: true,
        tower100: true,
        tower101: true,
        towers300: true,
        goods20: true,
        prize,
        drawPersisted: true,
        shippingConnected: false,
        personalStarsIndependent: true,
        realDemoIsolated: true,
        mobile: true,
        fallback: true,
        perf,
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Journey browser QA passed");
} finally {
  await browser.close();
}
