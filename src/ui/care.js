import { store, currentClock, data, spectate } from "../systems/runtime.js";
import { copy } from "../data/copy.js";
import { openShare } from "./share.js";
export function mountCare(panel, toast) {
  const root = document.createElement("section");
  root.className = "care-loop";
  root.innerHTML = copy("care.template");
  panel.querySelector(".stats").after(root);
  const choices = root.querySelector(".care-choices");
  data.care.forEach((item) => {
    const b = document.createElement("button");
    b.dataset.care = item.id;
    b.textContent = item.title;
    b.onclick = () => store.act("chooseCare", item.id, currentClock());
    choices.append(b);
  });
  const complete = root.querySelector("#completeCare");
  complete.onclick = () => {
    const before = store.summary(currentClock()).total;
    if (store.act("completeCare", null, currentClock())) {
      toast(copy("care.saved"));
      window.dispatchEvent(new Event("promy:care"));
      const total = store.summary(currentClock()).total;
      if (total > before && data.rewards.some((r) => r.days === total))
        window.dispatchEvent(
          new CustomEvent("promy:reward", { detail: total }),
        );
    }
  };
  root.querySelector("#openAlbum").onclick = () => openAlbum();
  function update() {
    const s = store.summary(currentClock()),
      letter = s.letter,
      chosen = data.care.find((x) => x.id === letter?.id);
    panel.classList.toggle("care-complete", letter?.done === true);
    root.querySelector("#careInstruction").textContent = chosen
      ? letter.done
        ? copy("share.today") + chosen.title
        : chosen.action
      : copy("care.choose");
    for (const b of choices.children) {
      b.setAttribute("aria-pressed", String(b.dataset.care === letter?.id));
      b.disabled = spectate || letter?.done === true;
    }
    complete.disabled = spectate || !letter || letter.done;
    complete.textContent = letter?.done
      ? copy("care.done")
      : copy("care.confirm");
    root.querySelector("#careProgress").textContent = copy("care.stamps")
      .replace("{n}", s.total)
      .replace("{left}", 7 - (s.total % 7));
    const strip = root.querySelector(".stamp-strip");
    strip.replaceChildren();
    const active = s.total % 7 || (s.total ? 7 : 0);
    for (let i = 0; i < 7; i++) {
      const cell = document.createElement("span");
      cell.textContent = i < active ? "✉" : "·";
      cell.className = i < active ? "earned" : "";
      cell.setAttribute(
        "aria-label",
        copy(i < active ? "care.earned" : "care.empty"),
      );
      strip.append(cell);
    }
  }
  store.subscribe(update);
  setInterval(update, 1000);
  update();
}
export function openAlbum() {
  let dialog = document.getElementById("stampAlbum");
  dialog?.remove();
  dialog = document.createElement("dialog");
  dialog.id = "stampAlbum";
  dialog.className = "share-dialog";
  const s = store.summary(currentClock());
  dialog.innerHTML = copy("care.album");
  const records = dialog.querySelector(".album-records");
  const days = Object.keys(store.state.days)
    .filter((d) => d <= currentClock().day)
    .sort()
    .reverse();
  if (!days.length) records.textContent = copy("care.noRecords");
  days.slice(0, 28).forEach((day) => {
    const record = document.createElement("p"),
      letter = store.state.letters[day],
      item = data.care.find((x) => x.id === letter?.id);
    record.textContent =
      day +
      " · " +
      (letter?.done && item ? item.title : copy("care.dailyRecord"));
    records.append(record);
  });
  dialog.querySelector(".album-summary").textContent = copy("care.albumCount")
    .replace("{n}", s.total)
    .replace("{cards}", Math.floor(s.total / 7));
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.querySelector("[data-share]").onclick = () => {
    dialog.close();
    openShare();
  };
  document.body.append(dialog);
  dialog.showModal();
}
