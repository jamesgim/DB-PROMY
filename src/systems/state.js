import { copy } from "../data/copy.js";
import { kst, dayNumber, weekKey } from "./clock.js";
import {
  freshStars,
  cleanStars,
  starProgress,
  validBirthday,
} from "./stars.js";
import {
  MISSION_IDS,
  freshJourney,
  cleanJourney,
  journeyProgress,
} from "./journey.js";
export const KEY = "promy.world.v4";
const LEGACY_KEY = "promy.world.v1";
const IDS = ["meal", "day", "home", "care"];
const CARE_IDS = MISSION_IDS;
const SOURCES = ["reels", "story", "blog", "qr-camp", "qr-concert", "kakao"];
const NAMES = [
  copy("text.002"),
  copy("text.003"),
  copy("text.004"),
  copy("text.005"),
  copy("text.006"),
  copy("text.007"),
];
const validDay = (d) =>
  typeof d === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  Number.isFinite(dayNumber(d)) &&
  new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
const count = (n) => (Number.isInteger(n) && n >= 0 && n <= 100000 ? n : 0);
export function fresh(variant = Math.floor(Math.random() * 6)) {
  return {
    version: 4,
    personalStars: freshStars(),
    journey: freshJourney(),
    variant,
    house: variant,
    name: NAMES[variant],
    days: {},
    letters: {},
    grace: [],
    pending: [],
    done: 0,
    events: [],
    unlocks: [],
    metrics: { generated: 0, shareClicks: 0, visits: {} },
  };
}
// Explicit allowlist: unknown fields, names, promise text and arbitrary URL values never persist.
export function migrate(raw) {
  if (!raw || ![1, 2, 3, 4].includes(raw.version)) return fresh();
  const next = fresh(count(raw.variant) % 6);
  next.house = count(raw.house) % 6;
  next.journey = cleanJourney(raw.journey);
  next.personalStars = cleanStars(raw.personalStars);
  for (const [day, letter] of Object.entries(raw.letters ?? {})) {
    if (validDay(day) && letter && CARE_IDS.includes(letter.id))
      next.letters[day] = { id: letter.id, done: letter.done === true };
  }
  for (const [day, flags] of Object.entries(raw.days ?? {})) {
    if (validDay(day) && Array.isArray(flags)) {
      const clean = IDS.filter((id) => flags.includes(id));
      if (clean.length) next.days[day] = clean;
    }
  }
  next.grace = [
    ...new Set((Array.isArray(raw.grace) ? raw.grace : []).filter(validDay)),
  ].sort();
  next.pending = (Array.isArray(raw.pending) ? raw.pending : [])
    .filter((n) => Number.isInteger(n) && n >= 0 && n < 6)
    .slice(0, 100);
  next.done = count(raw.done);
  next.events = (Array.isArray(raw.events) ? raw.events : [])
    .filter(
      (e) =>
        validDay(e.day) &&
        ["checkin", "star", "promise"].includes(e.type) &&
        Number.isInteger(e.category) &&
        e.category >= 0 &&
        e.category < 6,
    )
    .map((e) => ({ day: e.day, type: e.type, category: e.category }))
    .slice(-5000);
  next.unlocks = [
    "smoke",
    "tree",
    "gold",
    "upstairs",
    "qr-camp",
    "qr-concert",
  ].filter((x) => (raw.unlocks ?? []).includes(x));
  next.metrics.generated = count(raw.metrics?.generated);
  next.metrics.shareClicks = count(raw.metrics?.shareClicks);
  for (const source of SOURCES)
    next.metrics.visits[source] = count(raw.metrics?.visits?.[source]);
  return next;
}
export function summary(state, day) {
  const actual = Object.keys(state.days)
    .filter((d) => d <= day)
    .sort();
  const dates = new Set([...actual, ...state.grace.filter((d) => d <= day)]);
  let cursor = dayNumber(day);
  if (!dates.has(day)) cursor--;
  let streak = 0;
  while (dates.has(new Date(cursor * 86400000).toISOString().slice(0, 10))) {
    streak++;
    cursor--;
  }
  return {
    total: actual.length,
    streak,
    flags: state.days[day] ?? [],
    coupon: !state.grace.some((d) => weekKey(d) === weekKey(day)),
    stars:
      state.done +
      actual.filter((d) =>
        state.days[d].some((x) => x === "home" || x === "care"),
      ).length,
    letter: state.letters?.[day] ?? null,
  };
}
export function createStore({
  storage,
  now = () => Date.now(),
  spectate = false,
  demonstration = false,
  random = () => Math.random(),
} = {}) {
  let state,
    available = true;
  try {
    state = migrate(
      JSON.parse(
        storage?.getItem(KEY) ??
          storage?.getItem("promy.world.v3") ??
          storage?.getItem("promy.world.v2") ??
          storage?.getItem(LEGACY_KEY) ??
          "null",
      ),
    );
  } catch {
    state = fresh();
  }
  const listeners = new Set();
  function save() {
    try {
      storage?.setItem(KEY, JSON.stringify(state));
    } catch {
      available = false;
    }
  }
  function emit() {
    for (const fn of listeners) fn(state);
  }
  function act(type, payload, clock = kst(now())) {
    if (spectate) return false;
    const day = clock.day;
    if (["setBirthday", "recordVisit", "demoVisit"].includes(type)) {
      if (type === "setBirthday") {
        if (!validBirthday(payload)) return false;
        state.personalStars.birthday = {
          month: payload.month,
          day: payload.day,
        };
      } else {
        const branch =
          type === "demoVisit"
            ? state.personalStars.demo
            : state.personalStars.real;
        if (type === "demoVisit") {
          if (!demonstration || branch.count >= 100000) return false;
        } else {
          if (
            demonstration ||
            typeof payload !== "string" ||
            !/^[a-zA-Z0-9_-]{8,80}$/.test(payload) ||
            branch.sessions.includes(payload)
          )
            return false;
          branch.sessions = [...branch.sessions, payload].slice(-512);
        }
        branch.count++;
        if (branch.count % 100 === 0) branch.milestones[branch.count] = day;
      }
      save();
      emit();
      return true;
    }
    if (
      [
        "placeStone",
        "demoStone",
        "demoChoose",
        "demoConfirm",
        "drawReward",
        "resetDemo",
      ].includes(type)
    ) {
      const p = journeyProgress(state, day, demonstration);
      if (type === "resetDemo") {
        if (!demonstration) return false;
        state.journey.demo = freshJourney().demo;
        state.personalStars.demo = freshStars().demo;
      } else if (type === "placeStone") {
        if (demonstration || !p.canPlace) return false;
        state.journey.placedDays.push(day);
      } else if (type === "demoStone") {
        if (!demonstration || !p.canPlace) return false;
        state.journey.demo.stones++;
        const id = state.journey.demo.selection;
        state.journey.demo.counts[id] =
          (state.journey.demo.counts[id] ?? 0) + 1;
      } else if (type === "demoChoose") {
        if (!demonstration || !MISSION_IDS.includes(payload)) return false;
        state.journey.demo.selection = payload;
        state.journey.demo.confirmed = false;
      } else if (type === "demoConfirm") {
        if (!demonstration) return false;
        state.journey.demo.confirmed = true;
      } else {
        if (!p.available.includes(payload)) return false;
        const value = Math.max(0, Math.min(0.999999, Number(random()) || 0)),
          goodsId = 1 + Math.floor(value * 20);
        (demonstration ? state.journey.demo.draws : state.journey.draws)[
          payload
        ] = { goodsId, status: "awaiting-fulfillment" };
      }
      save();
      emit();
      return true;
    }
    if (
      demonstration &&
      ["chooseCare", "completeCare", "checkin"].includes(type)
    )
      return false;
    if (type === "chooseCare") {
      if (!CARE_IDS.includes(payload) || state.letters[day]?.done) return false;
      state.letters[day] = { id: payload, done: false };
      save();
      emit();
      return true;
    }
    if (type === "completeCare") {
      if (!state.letters[day] || state.letters[day].done) return false;
      state.letters[day].done = true;
      payload = "care";
      type = "checkin";
    }
    if (type === "checkin") {
      if (
        !IDS.includes(payload) ||
        (payload !== "care" &&
          clock.hour < (payload === "home" ? 18 : 17) &&
          !clock.demo)
      )
        return false;
      if (state.days[day]?.includes(payload)) return false;
      const previous = Object.keys(state.days)
        .filter((d) => d < day)
        .sort()
        .at(-1);
      if (
        !state.days[day] &&
        previous &&
        dayNumber(day) - dayNumber(previous) === 2
      ) {
        const missed = new Date((dayNumber(day) - 1) * 86400000)
          .toISOString()
          .slice(0, 10);
        if (!state.grace.some((d) => weekKey(d) === weekKey(missed)))
          state.grace.push(missed);
      }
      state.days[day] = [...(state.days[day] ?? []), payload];
      state.events.push({ day, type: "checkin", category: 0 });
      const total = Object.keys(state.days).length;
      [7, 30, 100, 365].forEach((n, i) => {
        const id = ["smoke", "tree", "gold", "upstairs"][i];
        if (total >= n && !state.unlocks.includes(id)) state.unlocks.push(id);
      });
    } else if (type === "promise") {
      if (
        !Number.isInteger(payload) ||
        payload < 0 ||
        payload > 5 ||
        state.pending.length >= 100
      )
        return false;
      state.pending.push(payload);
      state.events.push({ day, type, category: payload });
    } else if (type === "finish") {
      if (!state.pending.length) return false;
      const category = state.pending.shift();
      state.done++;
      state.events.push({ day, type: "star", category });
    } else if (type === "name") {
      const variant = NAMES.indexOf(payload);
      if (variant < 0) return false;
      state.name = payload;
      state.variant = variant;
    } else if (type === "visit") {
      if (!SOURCES.includes(payload)) return false;
      state.metrics.visits[payload] = (state.metrics.visits[payload] ?? 0) + 1;
      if (payload.startsWith("qr-") && !state.unlocks.includes(payload))
        state.unlocks.push(payload);
    } else if (type === "generated" || type === "shareClicks")
      state.metrics[type]++;
    else if (type === "reset") state = fresh(state.variant);
    else return false;
    state.events = state.events.slice(-5000);
    save();
    emit();
    return true;
  }
  save();
  return {
    get state() {
      return state;
    },
    get available() {
      return available;
    },
    spectate,
    demonstration,
    journey: (clock = kst(now())) =>
      journeyProgress(state, clock.day, demonstration),
    stars: (clock = kst(now())) =>
      starProgress(state, clock.day, demonstration),
    act,
    summary: (clock = kst(now())) => summary(state, clock.day),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    refresh() {
      emit();
    },
    // Same-origin tabs converge on saved state. This is not cross-device presence.
    sync(value) {
      try {
        state = migrate(JSON.parse(value));
        emit();
      } catch {
        /* retain valid in-memory state */
      }
    },
  };
}
