import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const b = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const c = await b.newContext({
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4173/world.html?demo=1&qa=1");
  await p.waitForFunction(() => window.__PROMY_QA__);
  const act = async (type, n = 1) =>
    p.evaluate(
      async ({ type, n }) => {
        const { store, currentClock } = await import(
          "./src/systems/runtime.js"
        );
        if (type === "birthday")
          return store.act(
            "setBirthday",
            { month: 9, day: 10 },
            currentClock(),
          );
        for (let i = 0; i < n; i++) store.act(type, null, currentClock());
      },
      { type, n },
    );
  await act("birthday");
  await p.waitForTimeout(200);
  assert.equal(
    await p.evaluate(() => window.__PROMY_QA__.sky.personalPoints),
    0,
  );
  assert.equal(await p.locator("#resetTowerDemo").count(), 0);
  assert.equal(await p.locator("#resetStarDemo").count(), 0);
  assert.ok(!(await p.locator(".daily-panel").innerText()).includes("키"));
  await act("demoVisit", 99);
  await p.locator("#openStars").click();
  assert.equal(await p.locator("#personalStarMessage").count(), 0);
  await p.screenshot({ path: "test-results/star-progress-99.png" });
  await p.locator("#zodiacName").click();
  await p.keyboard.press("2");
  assert.equal(await p.locator("#personalStarMessage").count(), 1);
  await p.locator("#starMilestoneCard").scrollIntoViewIfNeeded();
  await p.screenshot({ path: "test-results/star-complete-100.png" });
  await p.locator("#personalStars [data-close]").click();
  await act("demoVisit", 265);
  assert.equal(
    await p.evaluate(
      async () =>
        (await import("./src/systems/runtime.js")).store.stars().visits,
    ),
    365,
  );
  await p.keyboard.press("2");
  await p.waitForFunction(() => window.__PROMY_QA__.journey.visits === 0);
  await p.reload();
  await p.waitForFunction(() => window.__PROMY_QA__);
  assert.equal(
    await p.evaluate(() => window.__PROMY_QA__.sky.personalPoints),
    0,
  );
  await act("demoVisit", 100);
  await act("demoStone", 100);
  await p.waitForFunction(() => window.__PROMY_QA__.journey.stones === 100);
  assert.ok(
    (await p.evaluate(() => window.__PROMY_QA__.sky.towerHeights[0])) <=
      (await p.evaluate(() => window.__PROMY_QA__.playerHeight)),
  );
  await p.locator("#viewTowers").click();
  await p.waitForTimeout(1500);
  assert.equal(await p.locator(".sealed .tower-seal").count(), 1);
  assert.equal(await p.locator(".sealed .tower-seal b").innerText(), "약속");
  assert.ok(
    await p
      .locator(".sealed img")
      .evaluate((i) => i.complete && i.naturalWidth > 0),
  );
  await p.screenshot({ path: "test-results/completed-tower-seal.png" });
  await p.locator("#viewSky").click();
  await p.waitForFunction(() => window.__PROMY_QA__.view === "stars");
  await p.keyboard.press("8");
  await p.waitForFunction(() => window.__PROMY_QA__.sky.neighbors === 1);
  await act("addSkyBirthday", 363);
  await p.keyboard.press("8");
  await p.waitForFunction(() => window.__PROMY_QA__.sky.neighbors === 365);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: "test-results/sky-365.png" });
  await p.waitForTimeout(1000);
  const perf = await p.evaluate(() => window.__PROMY_QA__);
  assert.equal(perf.quality, "low");
  assert.equal(perf.renderLimit, 15);
  assert.equal(perf.pointLights, 4);
  const before = await p.evaluate(() => window.__PROMY_QA__.renderedFrames);
  await p.waitForTimeout(1200);
  const actualIdleFrames =
    (await p.evaluate(() => window.__PROMY_QA__.renderedFrames)) - before;
  assert.ok(actualIdleFrames <= 19);

  assert.ok(perf.calls < 55);
  await p.keyboard.press("7");
  await p.waitForFunction(() => window.__PROMY_QA__.sky.neighbors === 0);
  assert.ok(await p.evaluate(() => window.__PROMY_QA__.sky.personalPoints > 0));
  await p.getByRole("button", { name: "동네로 돌아가기", exact: true }).click();
  assert.equal(await p.locator(".sky-toolbar").isVisible(), false);
  await c.close();
  const f = await b.newPage({
    serviceWorkers: "block",
    viewport: { width: 390, height: 844 },
  });
  f.on("pageerror", (e) => errors.push(e.message));
  await f.goto("http://127.0.0.1:4173/fallback.html?demo=1");
  await f.locator("#viewSky").click();
  await f.waitForSelector("#skyCanvasDialog[open]");
  await f.keyboard.press("8");
  assert.equal(
    await f.evaluate(
      async () =>
        (await import("./src/systems/runtime.js")).store.state.personalStars
          .skyCount,
    ),
    1,
  );
  await f.keyboard.press("7");
  await f.getByRole("button", { name: "동네로 돌아가기", exact: true }).click();
  await f.close();
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/sky-performance-qa.json",
    JSON.stringify(
      {
        passed: true,
        progress0to100: true,
        resetAfter365: true,
        technicalControlsRemoved: true,
        characterHeightTower: true,
        promySeal: true,
        all365Birthdays: true,
        key8: true,
        key7: true,
        ownStarKept: true,
        fallback: true,
        actualIdleFramesPer1_2Seconds: actualIdleFrames,
        perf,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Progressive stars, 365 reset, all birthdays, key7/8, sealed tower, low-power rendering and fallback passed",
    perf.calls,
    perf.triangles,
    perf.renderLimit,
  );
} finally {
  await b.close();
}
