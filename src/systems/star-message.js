import { copy } from "../data/copy.js";
export function composeStarMessage(progress) {
  const index = (Math.max(100, progress.milestone) / 100 - 1) % 6;
  return copy("stars.message." + index).replaceAll(
    "{days}",
    progress.remaining,
  );
}
// Optional server adapter. No birth month/day is transmitted. Default is local-only.
export async function starMessage(progress, endpoint = null, signal) {
  const fallback = { text: composeStarMessage(progress), source: "local" };
  if (!endpoint) return fallback;
  try {
    const url = new URL(endpoint, location.origin);
    if (url.origin !== location.origin) return fallback;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zodiac: progress.sign.id,
        milestone: progress.milestone,
        year: Number(progress.cardDay.slice(0, 4)),
        remainingDays: progress.remaining,
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
        : AbortSignal.timeout(5000),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    if (
      typeof data.message !== "string" ||
      !data.message.trim() ||
      data.message.length > 500
    )
      return fallback;
    return {
      text: data.message.trim(),
      source: data.aiGenerated === true ? "ai" : "server",
    };
  } catch {
    return fallback;
  }
}
