import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => console.log("ERROR", e.message));
page.on("console", (m) => console.log(m.type(), m.text()));
page.on("requestfailed", (r) => console.log("FAIL", r.url(), r.failure()));
await page.goto("http://127.0.0.1:4173/world.html?admin=1&qa=1");
await page.waitForTimeout(5000);
console.log("URL", page.url());
console.log("BODY", (await page.locator("body").innerText()).slice(-1500));
await page.screenshot({ path: "test-results/smoke.png" });
console.log("QA", await page.evaluate(() => window.__PROMY_QA__));
await browser.close();
