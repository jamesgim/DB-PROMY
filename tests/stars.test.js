import test from "node:test";
import assert from "node:assert/strict";
import { createStore, migrate, fresh } from "../src/systems/state.js";
import {
  validBirthday,
  zodiacFor,
  daysRemaining,
} from "../src/systems/stars.js";
import { composeStarMessage } from "../src/systems/star-message.js";
const c = { day: "2026-09-10", hour: 12 };
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k), setItem: (k, v) => m.set(k, v) };
};
test("birthday boundaries, valid leap birthday and exact calendar remainder", () => {
  assert.equal(validBirthday({ month: 2, day: 29 }), true);
  assert.equal(validBirthday({ month: 2, day: 30 }), false);
  assert.equal(zodiacFor({ month: 9, day: 10 }).id, "virgo");
  assert.equal(zodiacFor({ month: 12, day: 25 }).id, "capricorn");
  assert.equal(zodiacFor({ month: 1, day: 20 }).id, "aquarius");
  assert.equal(daysRemaining(c.day), 112);
  assert.equal(daysRemaining("2026-12-31"), 0);
  assert.equal(daysRemaining("2028-01-01"), 365);
});
test("100 visits unlock a dated card independently from stones or reward tickets; 200 changes message", () => {
  const storage = memory(),
    s = createStore({ storage, demonstration: true });
  s.act("setBirthday", { month: 9, day: 10, year: 2000 }, c);
  for (let i = 0; i < 99; i++) s.act("demoVisit", null, c);
  assert.equal(s.stars(c).unlocked, false);
  s.act("demoVisit", null, c);
  const a = s.stars(c);
  assert.equal(a.remaining, 112);
  assert.equal(s.journey(c).stones, 0);
  assert.equal(s.journey(c).available.length, 0);
  assert.deepEqual(s.state.personalStars.birthday, { month: 9, day: 10 });
  assert.equal(s.stars({ day: "2026-09-11" }).cardDay, c.day);
  for (let i = 0; i < 100; i++) s.act("demoVisit", null, { day: "2026-09-11" });
  assert.notEqual(composeStarMessage(a), composeStarMessage(s.stars(c)));
  assert.equal(
    createStore({ storage, demonstration: true }).stars(c).visits,
    200,
  );
  assert.equal(createStore({ storage }).stars(c).visits, 0);
});
test("real sessions deduplicate refresh, persist and are isolated from demo; spectators cannot change birthdays", () => {
  const storage = memory(),
    s = createStore({ storage });
  assert.equal(s.act("recordVisit", "session_0001", c), true);
  assert.equal(s.act("recordVisit", "session_0001", c), false);
  assert.equal(createStore({ storage }).stars(c).visits, 1);
  assert.equal(s.act("demoVisit", null, c), false);
  assert.equal(
    createStore({ storage, spectate: true }).act(
      "setBirthday",
      { month: 2, day: 2 },
      c,
    ),
    false,
  );
  const old = fresh();
  old.version = 3;
  delete old.personalStars;
  assert.equal(migrate(old).personalStars.real.count, 0);
});
