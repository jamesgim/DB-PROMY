import { store, currentClock, data, spectate } from "../systems/runtime.js";
import { copy } from "../data/copy.js";
import { openShare } from "./share.js";
export { mountJourney as mountCare } from "./journey.js";
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
