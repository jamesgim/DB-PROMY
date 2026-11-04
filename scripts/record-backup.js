import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: "test-results/recording",
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/world.html?qa=1");
  await page.waitForFunction(() => window.__PROMY_QA__);
  await page.locator("[data-care=water]").click();
  await page.waitForTimeout(3000);
  await page.locator("#completeCare").click();
  await page.waitForTimeout(3000);
  await page.locator("#openAlbum").click();
  await page.waitForTimeout(3000);
  await page.locator("#stampAlbum [data-close]").click();
  await page.locator("#shareDaily").click();
  await page.waitForSelector(".share-dialog img");
  await page.waitForTimeout(3000);
  await page.evaluate(async () => {
    const r = await import("./src/systems/runtime.js");
    r.demo.hour = 21;
    window.dispatchEvent(new Event("promy:ritual"));
  });
  await page.waitForTimeout(8000);
  const video = page.video();
  await context.close();
  await video.saveAs("test-results/backup-raw.webm");
  console.log("Recorded actual browser demo");
} finally {
  await browser.close();
}
