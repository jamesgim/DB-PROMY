import { copy } from "../data/copy.js";
import {
  store,
  currentClock,
  data,
  admin,
  spectate,
  demo,
} from "../systems/runtime.js";
import { presence } from "../systems/presence.js";
import { openShare, exportEditorial, recordTimelapse } from "./share.js";
import { mountCare } from "./care.js";
export function toast(text) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3300);
}
export function mountDaily({
  onRitual = () => {},
  onMilestone = () => {},
  onChange = () => {},
} = {}) {
  document.body.classList.toggle("spectator", spectate);
  const panel = document.createElement("section");
  panel.className = "daily-panel glass";
  panel.setAttribute("aria-label", copy("text.025"));
  panel.innerHTML = copy("text.026");
  (document.querySelector(".fallback-layout") ?? document.body).append(panel);
  mountCare(panel, toast);
  const buttons = panel.querySelector(".checks");
  for (const item of data.checkin.standard) {
    const b = document.createElement("button");
    b.dataset.checkin = item.id;
    b.setAttribute("aria-pressed", "false");
    b.onclick = () => {
      const before = store.summary(currentClock());
      if (store.act("checkin", item.id, currentClock())) {
        toast(copy("text.027"));
        const after = store.summary(currentClock());
        if (before.coupon && !after.coupon) toast(copy("text.028"));
        if (
          after.total > before.total &&
          data.rewards.some((r) => r.days === after.total)
        )
          window.dispatchEvent(
            new CustomEvent("promy:reward", { detail: after.total }),
          );
      }
    };
    buttons.append(b);
  }
  document.getElementById("shareDaily").onclick = () => openShare();
  document.getElementById("showHome").onclick = () =>
    window.dispatchEvent(new Event("promy:home"));
  let lastDay = "",
    lastHour = -1,
    ritualDay = "",
    lastFlags = 0;
  function update() {
    const c = currentClock(),
      s = store.summary(c),
      p = presence(c, demo.neighbors);
    document.getElementById("dailyTotal").textContent = s.total;
    document.getElementById("dailyStreak").textContent =
      copy("text.029") + s.streak + copy("text.030");
    document.getElementById("dailyClock").textContent =
      c.day +
      " · " +
      String(c.hour).padStart(2, "0") +
      ":" +
      String(c.minute).padStart(2, "0") +
      " KST" +
      (c.demo ? copy("text.031") : "");
    const items = c.demo ? data.checkin.demo : data.checkin.standard;
    items.forEach((item) => {
      const b = buttons.querySelector("[data-checkin=" + item.id + "]");
      const done = s.flags.includes(item.id);
      b.textContent = (done ? "✓ " : "○ ") + item.label;
      b.setAttribute("aria-pressed", String(done));
      b.disabled = spectate || done || c.hour < item.hour;
      b.title = c.hour < item.hour ? item.hour + copy("text.032") : "";
    });
    const reward = data.rewards.filter((x) => s.total >= x.days).at(-1);
    document.getElementById("dailyMessage").textContent =
      (s.letter?.done
        ? copy("care.done")
        : s.flags.filter((x) => x !== "care").length === 3
          ? copy("text.033")
          : s.flags.length
            ? copy("text.034")
            : c.hour < 17 && !c.demo
              ? copy("text.035")
              : copy("text.036")) +
      (s.coupon ? copy("text.037") : copy("text.028")) +
      (reward ? " · " + reward.label : "");
    document.getElementById("dailyNeighbors").textContent = spectate
      ? copy("text.038") +
        p.label +
        " " +
        p.neighbors +
        copy("text.039") +
        (s.flags.length ? copy("text.040") : copy("text.041"))
      : copy("care.optionalCount")
          .replace("{pending}", store.state.pending.length)
          .replace("{done}", store.state.done);
    document.getElementById("storageNote").textContent = store.available
      ? copy("text.042")
      : copy("text.043");
    if (lastDay && lastDay !== c.day) {
      lastFlags = 0;
      toast(copy("text.044"));
    }
    if (lastHour !== c.hour && c.hour === 17) toast(copy("text.045"));
    if (c.hour === 21 && c.minute === 0 && ritualDay !== c.day) {
      ritualDay = c.day;
      onRitual();
    }
    if (s.flags.length > lastFlags) {
      onChange();
      lastFlags = s.flags.length;
    }
    lastDay = c.day;
    lastHour = c.hour;
  }
  store.subscribe(update);
  setInterval(update, 1000);
  update();
  if (admin) {
    const controls = document.createElement("details");
    controls.className = "admin-panel glass";
    controls.innerHTML = copy("text.046");
    (document.querySelector(".fallback-layout") ?? document.body).append(
      controls,
    );
    document.getElementById("demoHour").onchange = (e) => {
      demo.hour = e.target.value === "" ? null : Number(e.target.value);
      update();
    };
    document.getElementById("demoPresence").onchange = (e) => {
      demo.neighbors = e.target.value === "" ? null : Number(e.target.value);
      update();
    };
    document.getElementById("ritualNow").onclick = () => {
      demo.hour = 21;
      document.getElementById("demoHour").value = "21";
      onRitual();
      update();
    };
    document.getElementById("milestone100").onclick = () => {
      demo.milestone = demo.milestone === 100 ? 0 : 100;
      onMilestone(demo.milestone);
      toast(demo.milestone ? copy("text.047") : copy("text.048"));
    };
    document.getElementById("editorial").onclick = exportEditorial;
    document.getElementById("timelapse").onclick = async (e) => {
      e.target.disabled = true;
      try {
        await recordTimelapse();
        toast(copy("text.049"));
      } catch {
        toast(copy("text.050"));
      } finally {
        e.target.disabled = false;
      }
    };
  }
  if (!spectate) setTimeout(() => toast(copy("text.051")), 1300);
  return update;
}
