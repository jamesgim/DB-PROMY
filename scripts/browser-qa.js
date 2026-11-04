import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:4173";
await fs.mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const errors = [],
  requests = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", async (r) => {
  if (r.url().startsWith(base)) {
    const bytes = (await r.body().catch(() => Buffer.alloc(0))).length;
    requests.push({
      url: r.url().replace(base, ""),
      bytes,
      status: r.status(),
    });
  }
});
await page.goto(base + "/world.html?admin=1&qa=1");
await page.waitForFunction(() => window.__PROMY_QA__, { timeout: 60000 });
await page.locator(".admin-panel summary").click();
await page.selectOption("#demoHour", "18");
await page.locator("[data-checkin=meal]").click();
await page.locator("[data-checkin=day]").click();
await page.locator("[data-checkin=home]").click();
assert.equal(await page.locator("#dailyTotal").textContent(), "1");
await page.locator("#actPromise").click();
await page.locator('[data-category="3"]').click();
await page.locator("#seal").click();
assert.equal(await page.locator("#pending").textContent(), "1");
await page.locator("#actFinish").click();
await page.locator("#keep").click();
assert.equal(await page.locator("#pending").textContent(), "0");
await page.reload();
await page.waitForFunction(() => window.__PROMY_QA__, { timeout: 60000 });
assert.equal(await page.locator("#dailyTotal").textContent(), "1");
assert.match(await page.locator("#total").textContent(), /1/);
await page.locator(".admin-panel summary").click();
await page.locator("#ritualNow").click();
await page.waitForFunction(() => window.__PROMY_QA__?.ritual === true, null, {timeout:10000});
assert.equal((await page.evaluate(() => window.__PROMY_QA__)).ritual, true);
await page.screenshot({ path: "test-results/desktop.png" });
const perf = await page.evaluate(() => window.__PROMY_QA__);
assert.ok(perf.calls <= 60, 'render call budget');
assert.ok(perf.triangles <= 150000, 'triangle budget');
await page.locator("#milestone100").click();
await page.waitForTimeout(800);
await page.screenshot({ path: "test-results/milestone100.png" });
await page.locator("#shareDaily").click();
await page.waitForSelector(".share-dialog img");
await page.screenshot({ path: "test-results/share.png" });
const dl = page.waitForEvent("download");
await page.getByRole("button", { name: "9:16 저장", exact: true }).click();
const download = await dl;
await download.saveAs("test-results/share-portrait.png");
await page.getByRole("button", { name: "닫기", exact: true }).last().click();
await page.goto(base + "/fallback.html?admin=1");
await page.waitForSelector("[data-checkin]");
assert.equal(await page.locator("#dailyTotal").textContent(), "1");
await page.locator("#fallbackPromise").click();
await page.locator("#fallbackFinish").click();
await page.screenshot({ path: "test-results/fallback.png" });
const noGL = await browser.newContext();
await noGL.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    return type.includes("webgl") ? null : original.call(this, type, ...args);
  };
});
const fallback = await noGL.newPage();
await fallback.goto(base + "/world.html");
await fallback.waitForURL("**/fallback.html");
await fallback.waitForSelector("[data-checkin]");
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const mobile = await mobileContext.newPage();
mobile.on("pageerror", (e) => errors.push(e.message));
await mobile.goto(base + "/world.html?admin=1&qa=1");
await mobile.waitForFunction(() => window.__PROMY_QA__, { timeout: 60000 });
await mobile.locator(".admin-panel summary").click();
await mobile.selectOption("#demoHour", "18");
await mobile.locator("[data-checkin=meal]").click();
await mobile.locator(".admin-panel summary").click();
const before = await mobile.evaluate(() => window.__PROMY_QA__.player);
const joy = mobile.locator("#joystick"),
  r = await joy.boundingBox();
await mobile.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
await mobile.mouse.down();
await mobile.mouse.move(r.x + r.width / 2 + 35, r.y + r.height / 2);
await mobile.waitForTimeout(800);
await mobile.mouse.up();
const after = await mobile.evaluate(() => window.__PROMY_QA__.player);
assert.notDeepEqual(after, before);
await mobile.screenshot({ path: "test-results/mobile.png" });
const spectator = await context.newPage();
await spectator.goto(base + "/world.html?spectate=1&qa=1");
await spectator.waitForFunction(() => window.__PROMY_QA__, { timeout: 60000 });
assert.equal(await spectator.locator("#actPromise").isVisible(), false);
await spectator.screenshot({ path: "test-results/spectator.png" });
const six = await Promise.all(
  Array.from({ length: 6 }, async () => {
    const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    const p = await c.newPage();
    await p.goto(base + "/fallback.html?admin=1");
    await p.locator(".admin-panel summary").click();
    await p.selectOption("#demoHour", "18");
    await p.locator("[data-checkin=meal]").click();
    const total = await p.locator("#dailyTotal").textContent();
    await c.close();
    return total;
  }),
);
assert.deepEqual(six, ["1", "1", "1", "1", "1", "1"]);
const report = {
  perf,
  initialUncompressedBytes: requests
    .slice(
      0,
      requests.findIndex((x, i) => i > 0 && x.url.includes("world.html")),
    )
    .reduce((s, x) => s + x.bytes, 0),
  errors,
  isolatedConcurrentBrowsers: six.length,
  notes: [
    "Desktop and mobile emulation, software GPU; not physical-device FPS qualification.",
    "Six isolated 2D browser contexts, no cross-device synchronization claimed.",
  ],
};
await fs.writeFile(
  "test-results/browser-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
assert.deepEqual(errors, []);
