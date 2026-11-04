import { createStore, KEY } from "./state.js";
import { kst } from "./clock.js";
import { resolveCopy } from "../data/copy.js";
const params = new URLSearchParams(location.search);
let storage;
try {
  storage = localStorage;
} catch {
  storage = {
    setItem() {
      throw Error("unavailable");
    },
  };
}
export const admin = params.get("admin") === "1";
export const spectate = params.get("spectate") === "1";
export const store = createStore({ storage, spectate });
export const demo = { hour: null, neighbors: null, milestone: 0, ritual: 0 };
export function currentClock() {
  const c = kst();
  return demo.hour === null
    ? c
    : {
        ...c,
        hour: demo.hour,
        minute: 0,
        minutes: demo.hour * 60,
        phase:
          demo.hour < 6
            ? "dawn"
            : demo.hour < 17
              ? "day"
              : demo.hour < 21
                ? "evening"
                : "ritual",
        demo: true,
      };
}
export function loadData(name) {
  return fetch(new URL("../data/" + name + ".json", import.meta.url))
    .then((r) => {
      if (!r.ok) throw Error(name);
      return r.json();
    })
    .then(resolveCopy);
}
window.addEventListener("storage", (e) => {
  if (e.key === KEY) store.sync(e.newValue);
});
store.act("visit", params.get("src"));
store.act("name", params.get("name"));
console.info("PROMY local referral metrics", store.state.metrics.visits);
export const data = await Promise.all(
  ["checkin", "brand", "categories", "rewards", "care"].map(loadData),
).then(([checkin, brand, categories, rewards, care]) => ({
  checkin,
  brand,
  categories,
  rewards,
  care,
}));
