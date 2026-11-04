import { chromium } from "playwright";
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
    }),
    p = await context.newPage();
  await p.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  await p.locator("#viewTowers").click();
  for (let i = 0; i < 100; i++) await p.keyboard.press("1");
  await p.waitForTimeout(1200);
  await p.locator("#openGifts").click();
  await p.locator("#drawJourneyReward").click();
  await p.waitForSelector("#rewardResult img");
  await p.waitForTimeout(2500);
  await p.locator("#journeyRewards [data-close]").click();
  await p.locator("#viewTowers").click();
  for (let i = 0; i < 200; i++) await p.keyboard.press("1");
  await p.waitForTimeout(2500);
  await p.locator("#openStars").click();
  await p.waitForTimeout(2500);
  const video = p.video();
  await context.close();
  await video.saveAs("test-results/journey-demo-raw.webm");
  console.log("Recorded tower, goods and stars demo");
} finally {
  await browser.close();
}
