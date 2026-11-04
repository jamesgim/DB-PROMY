import { copy } from "../data/copy.js";
import { mountDaily, toast } from "./daily.js";
import {
  store,
  currentClock,
  data,
  spectate,
  demo,
} from "../systems/runtime.js";
import { hydrateCopy } from "../data/copy.js";
hydrateCopy();
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});
document.getElementById("back3d").href =
  "./world.html" + location.search.replace(/([?&])fallback=1&?/, "$1");
const select = document.getElementById("category");
data.categories.forEach((x) => {
  const o = document.createElement("option");
  o.value = x.id;
  o.textContent = x.name;
  select.append(o);
});
document.getElementById("fallbackPromise").onclick = () => {
  if (store.act("promise", Number(select.value), currentClock()))
    toast(copy("text.010"));
};
document.getElementById("fallbackFinish").onclick = () => {
  toast(
    store.act("finish", null, currentClock())
      ? copy("text.016")
      : copy("text.014"),
  );
};
document.getElementById("fallbackHello").onclick = () =>
  toast(copy("text.020"));
document.getElementById("fallbackChat").onclick = () => toast(copy("text.052"));
if (spectate)
  document
    .querySelectorAll(".campaign button,#category")
    .forEach((b) => (b.disabled = true));
const canvas = document.getElementById("town"),
  ctx = canvas.getContext("2d");
let ritualUntil = 0;
function draw() {
  const c = currentClock(),
    s = store.summary(c),
    night = c.hour >= 18 || c.hour < 6;
  ctx.fillStyle = night ? "#102c41" : "#8cbcb2";
  ctx.fillRect(0, 0, 850, 440);
  ctx.fillStyle = "#58876a";
  ctx.fillRect(0, 290, 850, 150);
  ctx.fillStyle = "#c9bfa8";
  ctx.fillRect(0, 360, 850, 45);
  ctx.fillStyle = "#f5f0df";
  ctx.fillRect(580, 210, 170, 130);
  ctx.fillStyle = "#275d49";
  ctx.beginPath();
  ctx.moveTo(560, 210);
  ctx.lineTo(665, 135);
  ctx.lineTo(770, 210);
  ctx.fill();
  ctx.fillStyle = s.flags.includes("home") ? "#ffe49e" : "#315452";
  ctx.fillRect(602, 240, 40, 45);
  ctx.fillStyle = s.flags.includes("meal") ? "#ffe49e" : "#315452";
  ctx.fillRect(688, 240, 40, 45);
  ctx.fillStyle = s.flags.includes("day") ? "#ffe49e" : "#785746";
  ctx.fillRect(645, 270, 37, 70);
  ctx.fillStyle = "#b95146";
  ctx.fillRect(370, 230, 75, 100);
  ctx.fillStyle = "#18392d";
  ctx.fillRect(380, 249, 55, 10);
  ctx.font = "20px system-ui";
  ctx.fillStyle = "#eef5df";
  ctx.fillText(copy("text.053"), 355, 220);
  ctx.fillText(copy("text.054"), 640, 125);
  const n = Math.min(35, store.state.pending.length);
  for (let i = 0; i < n; i++) {
    const x = 45 + i * 22;
    ctx.fillStyle = "#17543c";
    ctx.fillRect(x, 305, 3, 52);
    ctx.fillStyle = ritualUntil > Date.now() || night ? "#ffe49e" : "#91a67c";
    ctx.fillRect(x - 6, 295, 15, 18);
  }
  for (let i = 0; i < Math.min(70, s.stars); i++) {
    ctx.fillStyle = "#ffdf9e";
    ctx.fillRect(25 + ((i * 97) % 795), 20 + ((i * 41) % 100), 3, 3);
  }
  if (Math.max(s.total, demo.milestone) >= 100) {
    ctx.fillStyle = "#ffcc59";
    ctx.fillRect(765, 275, 18, 55);
    ctx.fillText(copy("text.055"), 650, 395);
  }
  ctx.fillStyle = "#f5f0df";
  ctx.beginPath();
  ctx.arc(240, 274, 35, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#f77734";
  ctx.fillRect(223, 315, 35, 13);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#f77734";
  ctx.beginPath();
  ctx.moveTo(240, 239);
  ctx.bezierCurveTo(216, 214, 267, 217, 249, 191);
  ctx.stroke();
  ctx.fillStyle = "#ffce22";
  ctx.fillRect(100, 257, 60, 68);
  ctx.fillStyle = "#00703c";
  ctx.fillRect(95, 310, 70, 15);
  ctx.font = "17px system-ui";
  ctx.fillStyle = "#f5f0df";
  ctx.fillText("PC", 225, 370);
  ctx.fillText(copy("text.056"), 102, 370);
  document.getElementById("fallbackStats").textContent =
    copy("text.057") +
    store.state.pending.length +
    copy("text.058") +
    store.state.done +
    copy("text.059") +
    s.flags.length +
    "/3";
}
mountDaily({
  onRitual: () => {
    ritualUntil = Date.now() + 10000;
    toast(copy("text.060"));
    draw();
  },
  onMilestone: draw,
  onChange: draw,
});
store.subscribe(draw);
setInterval(draw, 1000);
draw();
