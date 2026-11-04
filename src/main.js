import { mountDaily } from "./ui/daily.js";
import { hydrateCopy } from "./data/copy.js";
import { currentClock } from "./systems/runtime.js";
hydrateCopy();
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});
const params = new URLSearchParams(location.search);
const fallbackURL = "./fallback.html" + location.search;
if (params.get("fallback") === "1") location.replace(fallbackURL);
else {
  mountDaily({
    onRitual: () => window.dispatchEvent(new Event("promy:ritual")),
    onMilestone: () => window.dispatchEvent(new Event("promy:milestone")),
    onChange: () => window.dispatchEvent(new Event("promy:checkin")),
  });
  document.getElementById("toast").setAttribute("role", "status");
  try {
    const { startWorld } = await import("./world/main.js");
    const world = await startWorld();
    const clock = currentClock();
    if (clock.hour === 21 && clock.minute === 0) world.ritual();
  } catch (error) {
    console.error("3D startup failed", error);
    location.replace(fallbackURL);
  }
}
