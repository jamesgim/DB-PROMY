import { copy } from "../data/copy.js";
import { kst, dayNumber, weekKey } from "./clock.js";
export const KEY = "promy.world.v1";
const IDS = ["meal", "day", "home"];
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
    version: 1,
    variant,
    house: variant,
    name: NAMES[variant],
    days: {},
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
  if (!raw || raw.version !== 1) return fresh();
  const next = fresh(count(raw.variant) % 6);
  next.house = count(raw.house) % 6;
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
      state.done + actual.filter((d) => state.days[d].includes("home")).length,
  };
}
export function createStore({
  storage,
  now = () => Date.now(),
  spectate = false,
} = {}) {
  let state,
    available = true;
  try {
    state = migrate(JSON.parse(storage?.getItem(KEY) ?? "null"));
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
    if (type === "checkin") {
      if (
        !IDS.includes(payload) ||
        (clock.hour < (payload === "home" ? 18 : 17) && !clock.demo)
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
