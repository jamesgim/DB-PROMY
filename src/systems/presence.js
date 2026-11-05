import { copy } from "../data/copy.js";
// Replace this interface with a backend in v2. Never call these actual attendees.
export function presence(clock, simulated = null) {
  const count =
    simulated ??
    Math.round(12 + 38 * Math.exp(-(((clock.hour - 21) / 3) ** 2)));
  return {
    kind: "simulation",
    neighbors: Math.max(0, Math.min(100, Number(count) || 0)),
    label: copy("text.001"),
  };
}
