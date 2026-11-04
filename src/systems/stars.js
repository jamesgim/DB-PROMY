import { copy } from "../data/copy.js";
export const ZODIAC = [
  {
    id: "capricorn",
    name: copy("zodiac.capricorn"),
    from: 1222,
    points: [
      [0.16, 0.25],
      [0.43, 0.43],
      [0.77, 0.3],
      [0.67, 0.72],
      [0.35, 0.63],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [1, 4],
    ],
  },
  {
    id: "aquarius",
    name: copy("zodiac.aquarius"),
    from: 120,
    points: [
      [0.15, 0.25],
      [0.35, 0.3],
      [0.45, 0.18],
      [0.56, 0.3],
      [0.49, 0.42],
      [0.64, 0.51],
      [0.56, 0.65],
      [0.73, 0.75],
      [0.83, 0.62],
      [0.32, 0.58],
      [0.22, 0.73],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [4, 9],
      [9, 10],
    ],
  },
  {
    id: "pisces",
    name: copy("zodiac.pisces"),
    from: 219,
    points: [
      [0.12, 0.3],
      [0.23, 0.2],
      [0.32, 0.3],
      [0.22, 0.4],
      [0.43, 0.53],
      [0.67, 0.71],
      [0.8, 0.61],
      [0.87, 0.73],
      [0.76, 0.83],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 5],
    ],
  },
  {
    id: "aries",
    name: copy("zodiac.aries"),
    from: 321,
    points: [
      [0.2, 0.56],
      [0.48, 0.4],
      [0.72, 0.46],
      [0.8, 0.62],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    id: "taurus",
    name: copy("zodiac.taurus"),
    from: 420,
    points: [
      [0.12, 0.16],
      [0.32, 0.42],
      [0.5, 0.67],
      [0.64, 0.42],
      [0.86, 0.18],
      [0.2, 0.62],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
    ],
  },
  {
    id: "gemini",
    name: copy("zodiac.gemini"),
    from: 521,
    points: [
      [0.28, 0.15],
      [0.67, 0.2],
      [0.32, 0.35],
      [0.63, 0.4],
      [0.36, 0.58],
      [0.59, 0.63],
      [0.19, 0.82],
      [0.45, 0.83],
      [0.64, 0.87],
      [0.8, 0.75],
      [0.15, 0.4],
      [0.8, 0.46],
    ],
    links: [
      [0, 2],
      [1, 3],
      [2, 3],
      [2, 4],
      [3, 5],
      [4, 6],
      [4, 7],
      [5, 8],
      [5, 9],
      [2, 10],
      [3, 11],
    ],
  },
  {
    id: "cancer",
    name: copy("zodiac.cancer"),
    from: 621,
    points: [
      [0.5, 0.2],
      [0.47, 0.43],
      [0.52, 0.61],
      [0.25, 0.8],
      [0.78, 0.78],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  {
    id: "leo",
    name: copy("zodiac.leo"),
    from: 723,
    points: [
      [0.73, 0.15],
      [0.88, 0.25],
      [0.72, 0.39],
      [0.65, 0.56],
      [0.38, 0.65],
      [0.13, 0.4],
      [0.3, 0.25],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 4],
    ],
  },
  {
    id: "virgo",
    name: copy("zodiac.virgo"),
    from: 823,
    points: [
      [0.15, 0.25],
      [0.37, 0.35],
      [0.54, 0.27],
      [0.73, 0.2],
      [0.57, 0.5],
      [0.46, 0.72],
      [0.75, 0.73],
      [0.85, 0.87],
      [0.25, 0.6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
      [4, 5],
      [4, 6],
      [6, 7],
      [1, 8],
    ],
  },
  {
    id: "libra",
    name: copy("zodiac.libra"),
    from: 923,
    points: [
      [0.5, 0.18],
      [0.23, 0.43],
      [0.72, 0.43],
      [0.59, 0.73],
      [0.26, 0.79],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [1, 4],
    ],
  },
  {
    id: "scorpio",
    name: copy("zodiac.scorpio"),
    from: 1023,
    points: [
      [0.17, 0.14],
      [0.28, 0.25],
      [0.2, 0.36],
      [0.38, 0.3],
      [0.5, 0.44],
      [0.57, 0.64],
      [0.72, 0.82],
      [0.88, 0.71],
      [0.84, 0.56],
    ],
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
  },
  {
    id: "sagittarius",
    name: copy("zodiac.sagittarius"),
    from: 1122,
    points: [
      [0.2, 0.4],
      [0.35, 0.2],
      [0.55, 0.33],
      [0.73, 0.32],
      [0.83, 0.51],
      [0.65, 0.69],
      [0.36, 0.64],
      [0.49, 0.45],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [2, 7],
      [7, 6],
      [7, 0],
    ],
  },
];
export function validBirthday(value) {
  return (
    value &&
    Number.isInteger(value.month) &&
    Number.isInteger(value.day) &&
    value.month >= 1 &&
    value.month <= 12 &&
    value.day >= 1 &&
    value.day <=
      [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][value.month - 1]
  );
}
export function zodiacFor(value) {
  if (!validBirthday(value)) return null;
  const n = value.month * 100 + value.day;
  let result = ZODIAC[0];
  for (const sign of ZODIAC.slice(1)) if (n >= sign.from) result = sign;
  return n >= 1222 ? ZODIAC[0] : result;
}
export function validDay(day) {
  return (
    typeof day === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day + "T00:00:00Z")) &&
    new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day
  );
}
export function daysRemaining(day) {
  if (!validDay(day)) return 0;
  return (
    Math.round(
      (Date.UTC(Number(day.slice(0, 4)) + 1, 0, 1) -
        Date.parse(day + "T00:00:00Z")) /
        86400000,
    ) - 1
  );
}
export function freshStars() {
  return {
    birthday: null,
    real: { count: 0, sessions: [], milestones: {} },
    demo: { count: 0, milestones: {} },
    skyCount: 0,
  };
}
export function cleanStars(raw) {
  const out = freshStars();
  out.skyCount = Math.max(
    0,
    Math.min(365, Math.floor(Number(raw?.skyCount) || 0)),
  );
  if (validBirthday(raw?.birthday))
    out.birthday = { month: raw.birthday.month, day: raw.birthday.day };
  for (const mode of ["real", "demo"]) {
    const branch = raw?.[mode];
    out[mode].count =
      Number.isInteger(branch?.count) && branch.count >= 0
        ? branch.count % 366
        : 0;
    for (const [n, d] of Object.entries(branch?.milestones ?? {}))
      if (
        Number(n) > 0 &&
        Number(n) % 100 === 0 &&
        Number(n) <= out[mode].count &&
        validDay(d)
      )
        out[mode].milestones[n] = d;
  }
  out.real.sessions = [
    ...new Set(
      (Array.isArray(raw?.real?.sessions) ? raw.real.sessions : []).filter(
        (x) => typeof x === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(x),
      ),
    ),
  ].slice(-512);
  return out;
}
export function starProgress(state, day, demo = false) {
  const stars = state.personalStars ?? freshStars(),
    branch = demo ? stars.demo : stars.real,
    milestone = Math.floor(branch.count / 100) * 100,
    cardDay = branch.milestones[milestone] ?? day;
  return {
    mode: demo ? "demo" : "real",
    visits: branch.count,
    birthday: stars.birthday,
    sign: zodiacFor(stars.birthday),
    milestone,
    cardDay,
    remaining: daysRemaining(cardDay),
    unlocked: branch.count >= 100,
    fraction: Math.min(1, branch.count / 100),
  };
}

// Reveal an incomplete final edge until the hundredth visit. No full outline at 99.
export function constellationLines(sign, visits = 100) {
  if (!sign || visits <= 0) return { points: [], edges: [] };
  const fraction = Math.min(1, Math.max(0, visits / 100)),
    amount = sign.links.length * fraction,
    edges = [],
    ids = new Set();
  for (let i = 0; i < Math.ceil(amount); i++) {
    const [a, b] = sign.links[i],
      t = Math.min(1, amount - i),
      start = sign.points[a],
      end = sign.points[b];
    edges.push([
      start,
      [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t],
    ]);
    ids.add(a);
    if (t === 1) ids.add(b);
  }
  return { points: [...ids].map((i) => sign.points[i]), edges };
}
export function skyBirthdays(count) {
  return Array.from({ length: Math.max(0, Math.min(365, count)) }, (_, i) => {
    const d = new Date(Date.UTC(2027, 0, i + 1)),
      birthday = { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    return { ...birthday, sign: zodiacFor(birthday) };
  });
}
