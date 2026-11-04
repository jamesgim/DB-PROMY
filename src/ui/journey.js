import {
  store,
  currentClock,
  data,
  demonstration,
  spectate,
} from "../systems/runtime.js";
import { copy } from "../data/copy.js";
import { openPersonalStars } from "./personal-stars.js";
import { openAlbum } from "./care.js";
import { openShare } from "./share.js";
export function mountJourney(panel, toast) {
  const root = document.createElement("section");
  root.className = "care-loop journey-loop";
  root.innerHTML = copy("journey.template");
  panel.querySelector(".stats").after(root);
  const choices = root.querySelector(".care-choices");
  for (const mission of data.care) {
    const b = document.createElement("button");
    b.dataset.care = mission.id;
    b.textContent = mission.title;
    b.onclick = () =>
      store.act(
        demonstration ? "demoChoose" : "chooseCare",
        mission.id,
        currentClock(),
      );
    choices.append(b);
  }
  const confirm = root.querySelector("#completeCare"),
    place = root.querySelector("#placeStone");
  confirm.onclick = () => {
    if (
      store.act(
        demonstration ? "demoConfirm" : "completeCare",
        null,
        currentClock(),
      )
    ) {
      toast(copy("journey.confirmed"));
      window.dispatchEvent(new Event("promy:care"));
    }
  };
  function putStone() {
    const before = store.journey(currentClock());
    if (
      store.act(
        demonstration ? "demoStone" : "placeStone",
        null,
        currentClock(),
      )
    ) {
      const after = store.journey(currentClock());
      toast(
        copy(
          after.yearComplete
            ? "journey.done"
            : after.towers > before.towers
              ? "journey.hundred"
              : "journey.stoneAdded",
        ),
      );
      window.dispatchEvent(new CustomEvent("promy:stone", { detail: after }));
    }
  }
  place.onclick = putStone;
  function resetPart(type) {
    if (store.act(type, null, currentClock())) {
      if (type === "resetDemoTowers")
        document.getElementById("journeyRewards")?.close();
      toast(
        copy(
          type === "resetDemoTowers"
            ? "journey.resetTowersDone"
            : "stars.resetDone",
        ),
      );
    }
  }
  window.addEventListener("keydown", (e) => {
    if (
      demonstration &&
      !spectate &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !e.repeat &&
      !e.target.closest("input,select,textarea") &&
      ["Digit8", "Numpad8", "Digit7", "Numpad7"].includes(e.code)
    ) {
      e.preventDefault();
      store.act(
        e.code.endsWith("8") ? "addSkyBirthday" : "resetSkyBirthdays",
        null,
        currentClock(),
      );
      return;
    }
    if (
      demonstration &&
      !spectate &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !e.repeat &&
      !e.target.closest("input,select,textarea")
    ) {
      if (["Digit0", "Numpad0", "Digit9", "Numpad9"].includes(e.code)) {
        e.preventDefault();
        resetPart(e.code.endsWith("0") ? "resetDemoTowers" : "resetDemoStars");
        return;
      }
    }

    if (
      demonstration &&
      !spectate &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      ["Digit2", "Numpad2"].includes(e.code) &&
      !e.target.closest("input,select,textarea") &&
      !document.querySelector(".modal-back.open") &&
      !document.querySelector("dialog[open]:not(#personalStars)")
    ) {
      e.preventDefault();
      store.act("demoVisit", null, currentClock());
      return;
    }

    if (
      demonstration &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      ["Digit1", "Numpad1"].includes(e.code) &&
      !document.querySelector("dialog[open]") &&
      !e.target.closest("input,select,textarea")
    ) {
      e.preventDefault();
      putStone();
    }
  });
  root.querySelector("#viewTowers").onclick = () =>
    window.dispatchEvent(new Event("promy:towers"));
  root.querySelector("#openStars").onclick = openStars;
  root.querySelector("#openGifts").onclick = openRewards;
  root.querySelector("#openAlbum").onclick = openAlbum;
  root.querySelector("#switchJourneyMode")?.remove();
  const sky = document.createElement("button");
  sky.id = "viewSky";
  sky.textContent = copy("sky.view");
  sky.onclick = () => {
    window.dispatchEvent(new Event("promy:stars"));
  };
  root.querySelector(".journey-nav").append(sky);
  function update() {
    const s = store.summary(currentClock()),
      p = store.journey(currentClock());
    const selected = data.care.find((m) => m.id === p.selected);
    panel.classList.toggle("care-complete", p.confirmed && !demonstration);
    panel.classList.toggle("demo-journey", demonstration);
    root.querySelector("#journeyMode").textContent = copy("journey.welcome");
    root.querySelector("#careInstruction").textContent = selected
      ? selected.action
      : copy("journey.choose");
    for (const b of choices.children) {
      b.setAttribute("aria-pressed", String(b.dataset.care === p.selected));
      b.disabled = spectate || (!demonstration && p.confirmed);
    }
    confirm.disabled = spectate || !p.selected || p.confirmed;
    place.disabled = spectate || !p.canPlace;
    place.textContent = copy(
      p.yearComplete
        ? "journey.full"
        : p.placedToday && !demonstration
          ? "journey.placed"
          : "journey.place",
    );
    root.querySelector("#journeyHint").textContent = copy(
      p.yearComplete
        ? "journey.done"
        : !demonstration && p.placedToday
          ? "journey.placed"
          : p.canPlace
            ? "journey.confirmed"
            : "journey.choose",
    );
    root.querySelector(".tower-progress").replaceChildren();
    p.slots.forEach((n, i) => {
      const tile = document.createElement("div");
      tile.className = n === 100 ? "tower-tile complete" : "tower-tile";
      tile.innerHTML =
        "<b>" +
        copy("journey.tower").replace("{n}", i + 1) +
        "</b><strong>" +
        n +
        '/100</strong><progress max="100" value="' +
        n +
        '"></progress><small>' +
        (n === 100 ? copy("journey.towerComplete") : "") +
        "</small>";
      root.querySelector(".tower-progress").append(tile);
    });
    root.querySelector("#journeyGoal").textContent = copy("journey.goal")
      .replace("{n}", p.stones)
      .replace("{t}", p.towers);
    root.querySelector("#openGifts").textContent = copy(
      "journey.tickets",
    ).replace("{n}", p.available.length);
    root
      .querySelector("#openGifts")
      .classList.toggle("reward-ready", p.available.length > 0);
    const missionProgress = root.querySelector("#missionProgress");
    missionProgress.replaceChildren();
    for (const m of data.care) {
      const line = document.createElement("p");
      line.textContent = copy("journey.mission")
        .replace("{name}", m.title)
        .replace("{n}", Math.min(100, p.counts[m.id] ?? 0));
      if ((p.counts[m.id] ?? 0) >= 100)
        line.textContent += " · " + copy("journey.missionDone");
      missionProgress.append(line);
    }
  }
  store.subscribe(update);
  let lastDay = currentClock().day;
  setInterval(() => {
    if (currentClock().day !== lastDay) {
      lastDay = currentClock().day;
      update();
    }
  }, 30000);
  update();
}
function modal(id, title) {
  document.getElementById(id)?.remove();
  const d = document.createElement("dialog");
  d.id = id;
  d.className = "share-dialog journey-dialog";
  const h = document.createElement("h2");
  h.textContent = title;
  d.append(h);
  const close = document.createElement("button");
  close.dataset.close = "";
  close.textContent = copy("journey.close");
  close.onclick = () => d.close();
  d.append(close);
  document.body.append(d);
  return d;
}
export const openStars = openPersonalStars;
export function openRewards() {
  const d = modal("journeyRewards", copy("journey.gifts")),
    p = store.journey(currentClock());
  const intro = document.createElement("p");
  intro.textContent = copy("journey.giftsInfo");
  d.append(intro);
  const picker = document.createElement("select");
  picker.id = "rewardTicket";
  picker.setAttribute("aria-label", copy("journey.draw"));
  for (const ticket of p.available) {
    const o = document.createElement("option");
    o.value = ticket;
    o.textContent = ticket.startsWith("tower-")
      ? copy("journey.tower").replace("{n}", ticket.at(-1)) + " · 100/100"
      : (data.care.find((m) => m.id === ticket.slice(8))?.title ?? ticket) +
        " · 100/100";
    picker.append(o);
  }
  d.append(picker);
  const button = document.createElement("button");
  button.id = "drawJourneyReward";
  button.disabled = spectate || !p.available.length;
  button.textContent = copy(
    p.available.length ? "journey.draw" : "journey.locked",
  );
  d.append(button);
  const result = document.createElement("section");
  result.id = "rewardResult";
  d.append(result);
  function showResult(ticket, draw) {
    const goods = data.goods.find((g) => g.id === draw.goodsId);
    result.replaceChildren();
    const h = document.createElement("h3");
    h.textContent = copy("journey.result") + " · " + goods.name;
    const img = document.createElement("img");
    img.src = goods.image;
    img.alt = goods.name;
    img.className = "reward-product";
    const status = document.createElement("p");
    status.textContent =
      copy(demonstration ? "journey.demoResult" : "journey.realResult") +
      " · " +
      copy("journey.deliveryPending");
    const shipping = document.createElement("button");
    shipping.disabled = true;
    shipping.textContent = copy("journey.deliveryButton");
    result.append(h, img, status, shipping);
    result.dataset.ticket = ticket;
  }
  button.onclick = () => {
    const ticket = picker.value;
    if (store.act("drawReward", ticket, currentClock())) {
      button.disabled = true;
      picker.disabled = true;
      button.textContent = copy("journey.drawing");
      result.classList.add("gacha-opening");
      setTimeout(() => {
        if (
          !d.isConnected ||
          !d.open ||
          !store.journey(currentClock()).draws[ticket]
        )
          return;
        result.classList.remove("gacha-opening");
        showResult(ticket, store.journey(currentClock()).draws[ticket]);
        button.textContent = copy("journey.draw");
        const next = store.journey(currentClock());
        picker.replaceChildren();
        for (const ticket of next.available) {
          const option = document.createElement("option");
          option.value = ticket;
          option.textContent = ticket.startsWith("tower-")
            ? copy("journey.tower").replace("{n}", ticket.at(-1)) + " · 100/100"
            : (data.care.find((m) => m.id === ticket.slice(8))?.title ??
                ticket) + " · 100/100";
          picker.append(option);
        }
        button.disabled = spectate || !next.available.length;
        picker.disabled = !next.available.length;
        refreshOwned();
      }, 900);
    }
  };
  const latest = Object.entries(p.draws).at(-1);
  if (latest) showResult(...latest);
  const owned = document.createElement("details");
  function refreshOwned() {
    const current = store.journey(currentClock());
    owned.replaceChildren();
    const summary = document.createElement("summary");
    summary.textContent =
      copy("journey.owned") + " · " + Object.keys(current.draws).length;
    owned.append(summary);
    for (const [ticket, draw] of Object.entries(current.draws)) {
      const b = document.createElement("button");
      b.textContent = data.goods.find((g) => g.id === draw.goodsId)?.name ?? "";
      b.onclick = () => showResult(ticket, draw);
      owned.append(b);
    }
  }
  refreshOwned();
  d.append(owned);
  const notice = document.createElement("p");
  notice.className = "goods-notice";
  notice.textContent = copy("journey.goodsNotice");
  d.append(notice);
  const gallery = document.createElement("div");
  gallery.className = "goods-grid";
  for (const goods of data.goods) {
    const figure = document.createElement("figure"),
      img = document.createElement("img"),
      caption = document.createElement("figcaption");
    img.src = goods.image;
    img.alt = goods.name;
    img.loading = "lazy";
    caption.textContent = goods.name;
    figure.append(img, caption);
    gallery.append(figure);
  }
  d.append(gallery);
  d.showModal();
}
