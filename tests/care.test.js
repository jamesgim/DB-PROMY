import test from "node:test";
import assert from "node:assert/strict";
import { createStore, migrate, fresh } from "../src/systems/state.js";
const memory = () => {
  let value = null;
  return { getItem: () => value, setItem: (_, v) => (value = v) };
};
const clock = (day, hour = 0) => ({ day, hour });
test("care can be started and recorded at midnight, once per KST day, across reloads", () => {
  const storage = memory(),
    s = createStore({ storage }),
    c = clock("2026-11-05");
  assert.equal(s.act("completeCare", null, c), false);
  assert.ok(s.act("chooseCare", "water", c));
  assert.ok(s.act("completeCare", null, c));
  assert.equal(s.summary(c).total, 1);
  assert.equal(s.summary(c).letter.done, true);
  assert.equal(s.act("completeCare", null, c), false);
  assert.equal(s.act("chooseCare", "pause", c), false);
  assert.equal(s.act("checkin", "home", c), false);
  const loaded = createStore({ storage });
  assert.deepEqual(loaded.summary(c).letter, { id: "water", done: true });
  assert.equal(loaded.summary(c).total, 1);
  loaded.act("checkin", "home", clock(c.day, 19));
  assert.equal(loaded.summary(c).total, 1);
  assert.equal(loaded.summary(c).stars, 1);
  const tomorrow = clock("2026-11-06", 8);
  assert.equal(loaded.summary(tomorrow).letter, null);
  loaded.act("chooseCare", "pause", tomorrow);
  loaded.act("completeCare", null, tomorrow);
  assert.equal(loaded.summary(tomorrow).total, 2);
});
test("existing daily records survive care migration; unknown care prose is dropped", () => {
  const old = { ...fresh(1), version: 1, days: { "2026-11-04": ["home"] } };
  delete old.letters;
  const values = new Map([["promy.world.v1", JSON.stringify(old)]]);
  const migrated = createStore({
    storage: {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, v),
    },
  });
  assert.equal(migrated.state.version, 2);
  assert.deepEqual(migrated.state.days, old.days);
  assert.ok(values.has("promy.world.v2"));
  assert.equal(JSON.parse(values.get("promy.world.v1")).version, 1);
  assert.deepEqual(migrate(old).days, old.days);
  const clean = migrate({
    ...old,
    letters: {
      "2026-11-05": { id: "private prose", done: true },
      "2026-11-06": { id: "safe", done: true, body: "secret" },
    },
  });
  assert.deepEqual(clean.letters, { "2026-11-06": { id: "safe", done: true } });
});
test("seven distinct care days earn seven records; spectator cannot choose or stamp", () => {
  const s = createStore({ storage: memory() });
  for (let i = 0; i < 7; i++) {
    const c = clock("2026-11-" + String(i + 5).padStart(2, "0"));
    s.act("chooseCare", "safe", c);
    s.act("completeCare", null, c);
  }
  assert.equal(s.summary(clock("2026-11-11")).total, 7);
  assert.equal(Object.values(s.state.letters).filter((l) => l.done).length, 7);
  const spectator = createStore({ storage: memory(), spectate: true });
  assert.equal(
    spectator.act("chooseCare", "water", clock("2026-11-05")),
    false,
  );
});
