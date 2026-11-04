export const MISSION_IDS = ["water", "pause", "safe", "meal", "day", "home"];
export const GOODS_IDS = Array.from({ length: 20 }, (_, i) => i + 1);
const bounded = (v, max = 300) =>
  Number.isInteger(v) && v >= 0 ? Math.min(max, v) : 0;
const date = (d) =>
  typeof d === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  Number.isFinite(Date.parse(d + "T00:00:00Z")) &&
  new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
export function freshJourney() {
  return {
    placedDays: [],
    draws: {},
    demo: {
      stones: 0,
      counts: {},
      draws: {},
      selection: "home",
      confirmed: false,
    },
  };
}
function cleanDraws(raw) {
  const out = {};
  for (const [ticket, draw] of Object.entries(raw ?? {})) {
    if (
      /^(tower-[123]|promise-(water|pause|safe|meal|day|home))$/.test(ticket) &&
      GOODS_IDS.includes(draw?.goodsId)
    )
      out[ticket] = { goodsId: draw.goodsId, status: "awaiting-fulfillment" };
  }
  return out;
}
export function cleanJourney(raw) {
  const out = freshJourney();
  out.placedDays = [
    ...new Set(
      (Array.isArray(raw?.placedDays) ? raw.placedDays : []).filter(date),
    ),
  ]
    .sort()
    .slice(0, 300);
  out.draws = cleanDraws(raw?.draws);
  out.demo.stones = bounded(raw?.demo?.stones);
  out.demo.draws = cleanDraws(raw?.demo?.draws);
  for (const id of MISSION_IDS)
    out.demo.counts[id] = bounded(raw?.demo?.counts?.[id]);
  if (MISSION_IDS.includes(raw?.demo?.selection))
    out.demo.selection = raw.demo.selection;
  out.demo.confirmed = raw?.demo?.confirmed === true;
  return out;
}
export function journeyProgress(state, day, demo = false) {
  const j = state.journey ?? freshJourney(),
    counts = Object.fromEntries(MISSION_IDS.map((id) => [id, 0]));
  for (const [d, flags] of Object.entries(state.days)) {
    if (d > day) continue;
    const ids = new Set(flags.filter((id) => MISSION_IDS.includes(id)));
    const letter = state.letters[d];
    if (letter?.done && MISSION_IDS.includes(letter.id)) ids.add(letter.id);
    for (const id of ids) counts[id]++;
  }
  const placed = j.placedDays.filter((d) => d <= day && state.days[d]?.length),
    stones = demo ? j.demo.stones : Math.min(300, placed.length),
    draws = demo ? j.demo.draws : j.draws,
    activeCounts = demo ? j.demo.counts : counts;
  const tickets = [];
  for (let i = 1; i <= 3; i++)
    if (stones >= i * 100) tickets.push("tower-" + i);
  for (const id of MISSION_IDS)
    if ((activeCounts[id] ?? 0) >= 100) tickets.push("promise-" + id);
  const validDraws = Object.fromEntries(
    Object.entries(draws).filter(([id]) => tickets.includes(id)),
  );
  return {
    mode: demo ? "demo" : "real",
    stones,
    towers: Math.floor(stones / 100),
    slots: [0, 1, 2].map((i) => Math.max(0, Math.min(100, stones - i * 100))),
    yearComplete: stones === 300,
    counts: activeCounts,
    tickets,
    available: tickets.filter((t) => !validDraws[t]),
    draws: validDraws,
    canPlace: demo
      ? stones < 300
      : stones < 300 && !!state.days[day]?.length && !placed.includes(day),
    placedToday: placed.includes(day),
    selected: demo ? j.demo.selection : state.letters[day]?.id,
    confirmed: demo ? j.demo.confirmed : !!state.letters[day]?.done,
  };
}
export function starPosition(index, variant = 0) {
  const a = index * 2.3999632297 + variant * 0.32,
    r = Math.sqrt((index + 1) / 300);
  return { x: 0.5 + Math.cos(a) * r * 0.42, y: 0.5 + Math.sin(a) * r * 0.38 };
}
