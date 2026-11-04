import test from "node:test";
import assert from "node:assert/strict";
import {
  createStore,
  KEY,
  migrate,
  summary,
  fresh,
} from "../src/systems/state.js";
import { kst, weekKey } from "../src/systems/clock.js";
const memory = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
};
const clock = (day, hour = 19) => ({ day, hour });
test("KST midnight and opening boundaries are independent of browser timezone", () => {
  assert.equal(kst(Date.parse("2026-11-04T14:59:59Z")).day, "2026-11-04");
  assert.equal(kst(Date.parse("2026-11-04T15:00:00Z")).day, "2026-11-05");
  assert.equal(kst(Date.parse("2026-11-04T08:00:00Z")).hour, 17);
  assert.equal(weekKey("2027-01-01"), "2026-12-28");
});
test("three flags give one daily credit and reload preserves house, promises and stars", () => {
  const storage = memory(),
    store = createStore({ storage }),
    c = clock("2026-11-04");
  assert.equal(store.act("checkin", "meal", c), true);
  assert.equal(store.act("checkin", "meal", c), false);
  store.act("checkin", "day", c);
  store.act("checkin", "home", c);
  store.act("promise", 3, c);
  store.act("finish", null, c);
  const loaded = createStore({ storage });
  assert.equal(loaded.summary(c).total, 1);
  assert.equal(loaded.summary(c).stars, 2);
  assert.equal(loaded.summary(c).flags.length, 3);
  assert.equal(loaded.state.house, store.state.house);
  assert.equal(loaded.state.done, 1);
  assert.equal(loaded.act("finish", null, c), false);
});
test("standard schedule blocks before 17/18, explicit demo can check in", () => {
  const s = createStore({ storage: memory() });
  assert.equal(s.act("checkin", "meal", clock("2026-11-04", 16)), false);
  assert.equal(s.act("checkin", "meal", clock("2026-11-04", 17)), true);
  assert.equal(s.act("checkin", "home", clock("2026-11-04", 17)), false);
  assert.equal(s.act("checkin", "home", clock("2026-11-04", 18)), true);
  assert.equal(
    s.act("checkin", "day", { ...clock("2026-11-04", 12), demo: true }),
    true,
  );
});
test("one grace day per KST week preserves streak without adding cumulative days", () => {
  const s = createStore({ storage: memory() });
  s.act("checkin", "meal", clock("2026-11-02"));
  s.act("checkin", "meal", clock("2026-11-04"));
  assert.deepEqual(s.state.grace, ["2026-11-03"]);
  assert.equal(s.summary(clock("2026-11-04")).total, 2);
  assert.equal(s.summary(clock("2026-11-04")).streak, 3);
  s.act("checkin", "meal", clock("2026-11-06"));
  assert.equal(s.state.grace.length, 1);
  assert.equal(s.summary(clock("2026-11-06")).streak, 1);
  s.act("checkin", "meal", clock("2026-11-09"));
  s.act("checkin", "meal", clock("2026-11-11"));
  assert.equal(s.state.grace.length, 2);
});
test("a missing Sunday consumes the prior week coupon, next week remains available", () => {
  const s = createStore({ storage: memory() });
  s.act("checkin", "meal", clock("2026-11-07"));
  s.act("checkin", "meal", clock("2026-11-09"));
  assert.deepEqual(s.state.grace, ["2026-11-08"]);
  assert.equal(s.summary(clock("2026-11-09")).coupon, true);
});
test("midnight resets flags and visits accept only known sources", () => {
  const s = createStore({ storage: memory() });
  s.act("checkin", "home", clock("2026-11-04"));
  assert.deepEqual(s.summary(clock("2026-11-05")).flags, []);
  s.act("visit", "qr-camp");
  assert.equal(s.state.metrics.visits["qr-camp"], 1);
  assert.ok(s.state.unlocks.includes("qr-camp"));
  assert.equal(s.act("visit", "private-message"), false);
});
test("migration drops private or malformed values; storage failure retains playable memory", () => {
  const s = createStore({
    storage: {
      getItem() {
        return "{oops";
      },
      setItem() {
        throw Error();
      },
    },
  });
  assert.equal(s.available, false);
  assert.ok(s.act("checkin", "meal", clock("2026-11-04")));
  const data = migrate({
    ...fresh(2),
    name: "private name",
    text: "secret",
    days: { "2026-02-30": ["home"], "2026-11-04": ["meal", "unknown", "meal"] },
    pending: [1, "raw text", 99],
  });
  assert.equal("text" in data, false);
  assert.notEqual(data.name, "private name");
  assert.deepEqual(data.days, { "2026-11-04": ["meal"] });
  assert.deepEqual(data.pending, [1]);
});
test("spectator never writes actions; sync shares only same-origin saved records", () => {
  const storage = memory(),
    s = createStore({ storage, spectate: true });
  const before = storage.getItem(KEY);
  assert.equal(s.act("checkin", "home", clock("2026-11-04")), false);
  assert.equal(storage.getItem(KEY), before);
  const other = createStore({ storage });
  other.act("checkin", "meal", clock("2026-11-04"));
  s.sync(storage.getItem(KEY));
  assert.equal(s.summary(clock("2026-11-04")).total, 1);
});
test("100 cumulative days unlock golden home and a long gap keeps total but resets streak", () => {
  const s = createStore({ storage: memory() });
  for (let i = 0; i < 100; i++) {
    const day = new Date(Date.parse("2026-01-01") + i * 86400000)
      .toISOString()
      .slice(0, 10);
    s.act("checkin", "meal", clock(day));
  }
  assert.ok(s.state.unlocks.includes("gold"));
  assert.equal(summary(s.state, "2026-06-01").total, 100);
  assert.equal(summary(s.state, "2026-06-01").streak, 0);
});
