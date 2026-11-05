import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    p = await context.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal(await p.locator(".status").isVisible(), false);
  const scale = await p.evaluate(() => window.__PROMY_QA__.playerHeight);
  assert.ok(scale < 2.5 && scale > 1.5);
  assert.equal(await p.evaluate(() => window.__PROMY_QA__.hasCampfire), false);
  await p.locator("[data-care=water]").click();
  assert.equal(await p.locator("#completeCare").isDisabled(), false);
  await p.screenshot({ path: "test-results/improved-desktop.png" });
  await p.locator("#completeCare").click();
  assert.equal(await p.locator("#dailyTotal").textContent(), "1");
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal(await p.locator("#completeCare").isDisabled(), true);
  assert.equal(await p.locator("#dailyTotal").textContent(), "1");
  await p.locator("#openAlbum").click();
  assert.match(
    await p.locator("#stampAlbum .album-records").textContent(),
    /물 한 잔/,
  );
  await p.locator("#stampAlbum [data-share]").click();
  await p.waitForSelector(".share-dialog img");
  await p.evaluate(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      writable: true,
      value: ({ files }) => files?.length === 1,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      writable: true,
      value: async ({ files }) => {
        const view = new DataView(await files[0].arrayBuffer());
        window.__shared = {
          count: files.length,
          name: files[0].name,
          width: view.getUint32(16),
          height: view.getUint32(20),
        };
      },
    });
  });
  await p.locator("[data-instagram=story]").click();
  await p.waitForFunction(() => window.__shared);
  assert.deepEqual(await p.evaluate(() => window.__shared), {
    count: 1,
    name: "promy-1080x1920.png",
    width: 1080,
    height: 1920,
  });
  await p.locator("[data-instagram=feed]").click();
  await p.waitForFunction(() => window.__shared.height === 1080);
  assert.equal(await p.evaluate(() => window.__shared.width), 1080);
  await p.evaluate(() => {
    navigator.share = async () => {
      throw new DOMException("cancel", "AbortError");
    };
  });
  await p.locator("[data-instagram=story]").click();
  assert.match(await p.locator(".share-dialog p").textContent(), /취소/);
  await p.evaluate(() => {
    navigator.canShare = () => false;
  });
  await p.locator("[data-instagram=story]").click();
  assert.match(await p.locator(".share-dialog p").textContent(), /저장한 뒤/);
  await p.screenshot({ path: "test-results/instagram-flow.png" });
  await context.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto("http://127.0.0.1:4173/world.html?qa=1");
  await m.waitForFunction(() => window.__PROMY_QA__);
  await m.locator("[data-care=pause]").click();
  await m.locator("#completeCare").click();
  assert.equal(await m.locator("#dailyTotal").textContent(), "1");
  await m.screenshot({ path: "test-results/improved-mobile.png" });
  await mobile.close();
  const fallback = await browser.newPage();
  await fallback.goto("http://127.0.0.1:4173/fallback.html");
  await fallback.locator("[data-care=safe]").click();
  await fallback.locator("#completeCare").click();
  assert.equal(await fallback.locator("#dailyTotal").textContent(), "1");
  await fallback.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/improvements-report.json",
    JSON.stringify(
      {
        midnightCare: true,
        persistence: true,
        album: true,
        playerHeight: scale,
        noCampfire: true,
        shareSinglePNGStoryAndFeed: true,
        shareCancelAndUnsupported: true,
        mobile: true,
        fallback: true,
        errors,
        instagramAppPostingVerified: false,
      },
      null,
      2,
    ),
  );
  console.log(
    "Improvement QA passed; OS/Instagram handoff is mocked, actual posting is not claimed.",
  );
} finally {
  await browser.close();
}
