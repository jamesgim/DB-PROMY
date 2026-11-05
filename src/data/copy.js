import catalog from "./copy.ko.json" with { type: "json" };
export const copy = (key) => catalog[key] ?? key;
export function resolveCopy(value) {
  if (typeof value === "string" && value.startsWith("$"))
    return copy(value.slice(1));
  if (Array.isArray(value)) return value.map(resolveCopy);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveCopy(v)]),
    );
  return value;
}
export function hydrateCopy() {
  document
    .querySelectorAll("[data-copy]")
    .forEach((e) => (e.textContent = copy(e.dataset.copy)));
  for (const attr of ["aria-label", "title"])
    document
      .querySelectorAll("[data-copy-" + attr + "]")
      .forEach((e) =>
        e.setAttribute(attr, copy(e.getAttribute("data-copy-" + attr))),
      );
}
