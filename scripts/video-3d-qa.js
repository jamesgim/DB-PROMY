import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const c = await browser.newContext({
      viewport: { width: 960, height: 720 },
      acceptDownloads: true,
    }),
    p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?admin=1&quality=low&qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  await p.locator(".admin-panel summary").click();
  await p.selectOption("#demoHour", "21");
  const download = p.waitForEvent("download", { timeout: 45000 });
  await p.locator("#timelapse").click();
  const file = await download;
  await file.saveAs("test-results/sky-3d-30s.webm");
  if (errors.length) throw Error(errors.join("\n"));
  console.log("Actual 3D sky camera video exported without browser errors");
} finally {
  await browser.close();
}
