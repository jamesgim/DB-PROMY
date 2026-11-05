import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const c = await browser.newContext(),
    p = await c.newPage();
  await p.clock.install({ time: new Date("2026-11-04T14:59:59Z") });
  await p.goto("http://127.0.0.1:4173/fallback.html");
  await p.locator(".evening-checks").evaluate((el) => (el.open = true));
  await p.locator("[data-checkin=meal]").click();
  await p.clock.runFor(2000);
  assert.match(await p.locator("#dailyClock").textContent(), /2026-11-05/);
  assert.equal(
    await p.locator("[data-checkin=meal]").getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(await p.locator("[data-checkin=meal]").isDisabled(), true);
  assert.equal(await p.locator("#dailyTotal").textContent(), "1");
  await p.clock.setFixedTime(new Date("2026-11-05T08:00:00Z"));
  await p.clock.runFor(1000);
  await p.locator(".evening-checks").evaluate((el) => (el.open = true));
  await p.locator("[data-checkin=meal]").click();
  assert.equal(await p.locator("#dailyTotal").textContent(), "2");
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload();
  await p.waitForSelector("[data-checkin]");
  await c.setOffline(true);
  await p.reload();
  await p.waitForSelector("[data-checkin]");
  assert.equal(await p.locator("#dailyTotal").textContent(), "2");
  await c.setOffline(false);
  await c.close();
  const six = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
      });
      const page = await context.newPage();
      await page.goto(
        "http://127.0.0.1:4173/world.html?admin=1&qa=1&quality=low",
      );
      await page.waitForFunction(() => window.__PROMY_QA__, null, {
        timeout: 60000,
      });
      await page.locator(".admin-panel summary").click();
      await page.selectOption("#demoHour", "18");
      await page.locator(".evening-checks").evaluate((el) => (el.open = true));
      await page.locator("[data-checkin=meal]").click();
      const record = {
        browser: i + 1,
        total: await page.locator("#dailyTotal").textContent(),
        ...(await page.evaluate(() => window.__PROMY_QA__)),
      };
      assert.equal(record.total, "1");
      await context.close();
      return record;
    }),
  );
  await fs.writeFile(
    "test-results/extended-report.json",
    JSON.stringify(
      {
        liveMidnight: true,
        offlineReload: true,
        sixConcurrent3DBrowsers: six,
        physicalDevices: false,
      },
      null,
      2,
    ),
  );
  console.log(
    "Live KST midnight, offline reload and six concurrent isolated 3D browsers passed",
  );
} finally {
  await browser.close();
}
