export const DAY = 86400000;
export function kst(now = Date.now()) {
  const date = new Date(Number(now) + 9 * 3600000);
  const day = date.toISOString().slice(0, 10);
  const hour = date.getUTCHours(),
    minute = date.getUTCMinutes();
  return {
    day,
    hour,
    minute,
    minutes: hour * 60 + minute,
    phase:
      hour < 6 ? "dawn" : hour < 17 ? "day" : hour < 21 ? "evening" : "ritual",
  };
}
export const dayNumber = (day) => Date.parse(day + "T00:00:00Z") / DAY;
export function weekKey(day) {
  const date = new Date(day + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
