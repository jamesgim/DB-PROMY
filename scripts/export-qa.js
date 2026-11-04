import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 960, height: 720 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/fallback.html?admin=1");
  await page.locator(".admin-panel summary").click();
  await page.selectOption("#demoHour", "18");
  await page.locator(".evening-checks").evaluate((el) => (el.open = true));
  await page.locator("[data-checkin=home]").click();
  await page.locator("#fallbackPromise").click();
  await page.locator("#fallbackFinish").click();
  const download = page.waitForEvent("download", { timeout: 45000 });
  await page.locator("#timelapse").click();
  const video = await download;
  await video.saveAs("test-results/sky-30s.webm");
  console.log("30 second video exported");
  const received = [];
  page.on("download", async (d) => {
    const file = "test-results/" + d.suggestedFilename();
    await d.saveAs(file);
    received.push(file);
  });
  await page.locator("#editorial").click();
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  await page.waitForTimeout(2000);
  console.log("Editorial exports", received);
} finally {
  await browser.close();
}
