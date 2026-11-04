import test from "node:test";
import assert from "node:assert/strict";
import { createStore, KEY, migrate, fresh } from "../src/systems/state.js";
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
};
const clock = (i = 0) => ({
  day: new Date(Date.parse("2026-01-01") + i * 86400000)
    .toISOString()
    .slice(0, 10),
  hour: 0,
});
function complete(store, i, id = "meal") {
  const c = clock(i);
  store.act("chooseCare", id, c);
  store.act("completeCare", null, c);
  return c;
}
test("one real stone requires a recorded promise and is idempotent per KST day", () => {
  const s = createStore({ storage: memory() });
  assert.equal(s.act("placeStone", null, clock()), false);
  complete(s, 0);
  assert.equal(s.journey(clock()).canPlace, true);
  assert.ok(s.act("placeStone", null, clock()));
  assert.equal(s.act("placeStone", null, clock()), false);
  assert.equal(s.journey(clock()).stones, 1);
  assert.equal(s.act("demoStone", null, clock()), false);
  const next = complete(s, 1);
  s.act("placeStone", null, next);
  assert.equal(s.journey(next).stars, 2);
});
test("100 stones finish first tower, next starts second, random reward cannot reroll", () => {
  const storage = memory(),
    s = createStore({ storage, random: () => 0.999 });
  for (let i = 0; i < 100; i++) {
    const c = complete(s, i);
    s.act("placeStone", null, c);
  }
  const c = clock(100),
    p = s.journey(c);
  assert.deepEqual(p.slots, [100, 0, 0]);
  assert.ok(p.available.includes("tower-1"));
  assert.ok(p.available.includes("promise-meal"));
  assert.ok(s.act("drawReward", "tower-1", c));
  assert.equal(s.journey(c).draws["tower-1"].goodsId, 20);
  assert.equal(s.act("drawReward", "tower-1", c), false);
  assert.equal(s.act("drawReward", "tower-3", c), false);
  complete(s, 100);
  s.act("placeStone", null, c);
  assert.deepEqual(s.journey(c).slots, [100, 1, 0]);
  const restored = createStore({ storage });
  assert.deepEqual(restored.journey(c).slots, [100, 1, 0]);
  assert.equal(
    restored.journey(c).draws["tower-1"].status,
    "awaiting-fulfillment",
  );
});
test("demo 1-key style repetitions reach 300 but do not change real records or prizes", () => {
  const storage = memory(),
    demo = createStore({ storage, demonstration: true, random: () => 0 });
  for (let i = 0; i < 300; i++) assert.ok(demo.act("demoStone", null, clock()));
  assert.equal(demo.act("demoStone", null, clock()), false);
  assert.deepEqual(demo.journey(clock()).slots, [100, 100, 100]);
  assert.equal(demo.journey(clock()).yearComplete, true);
  assert.equal(demo.journey(clock()).stars, 300);
  assert.ok(demo.act("drawReward", "tower-1", clock()));
  assert.equal(demo.journey(clock()).draws["tower-1"].goodsId, 1);
  const real = createStore({ storage });
  assert.equal(real.journey(clock()).stones, 0);
  assert.deepEqual(real.journey(clock()).draws, {});
  assert.equal(real.summary(clock()).total, 0);
  assert.equal(demo.act("completeCare", null, clock()), false);
  assert.ok(demo.act("resetDemo", null, clock()));
  assert.equal(demo.journey(clock()).stones, 0);
  assert.equal(real.act("resetDemo", null, clock()), false);
});
test("three real towers cap at 300; category checks deduplicate within a date", () => {
  const s = createStore({ storage: memory() });
  for (let i = 0; i < 301; i++) {
    complete(s, i);
    s.act("checkin", "meal", { ...clock(i), hour: 20 });
    s.act("placeStone", null, clock(i));
  }
  const p = s.journey(clock(301));
  assert.equal(p.stones, 300);
  assert.equal(p.counts.meal, 301);
  assert.deepEqual(p.slots, [100, 100, 100]);
  assert.equal(p.available.filter((x) => x.startsWith("tower-")).length, 3);
});
test("migration keeps old records without inventing stones, discards fake shipment status", () => {
  const raw = { ...fresh(0), version: 2, days: { "2026-01-01": ["care"] } };
  delete raw.journey;
  const next = migrate(raw);
  assert.deepEqual(next.journey.placedDays, []);
  assert.deepEqual(next.days, raw.days);
  const sanitized = migrate({
    ...next,
    journey: {
      placedDays: ["2026-01-01", "bad", "2026-01-01"],
      draws: {
        "tower-1": { goodsId: 2, status: "shipped" },
        "tower-99": { goodsId: 1 },
      },
      demo: { stones: 500 },
    },
  });
  assert.deepEqual(sanitized.journey.placedDays, ["2026-01-01"]);
  assert.equal(
    sanitized.journey.draws["tower-1"].status,
    "awaiting-fulfillment",
  );
  assert.equal(sanitized.journey.draws["tower-99"], undefined);
  assert.equal(sanitized.journey.demo.stones, 300);
});
test("spectators cannot place or draw even in demo mode", () => {
  const s = createStore({
    storage: memory(),
    spectate: true,
    demonstration: true,
  });
  assert.equal(s.act("demoStone", null, clock()), false);
  assert.equal(s.act("drawReward", "tower-1", clock()), false);
});
