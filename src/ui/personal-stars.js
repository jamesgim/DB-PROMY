import {
  store,
  currentClock,
  data,
  demonstration,
  spectate,
} from "../systems/runtime.js";
import { copy } from "../data/copy.js";
import { validBirthday } from "../systems/stars.js";
import { composeStarMessage, starMessage } from "../systems/star-message.js";
import { download } from "./share.js";
export function paintZodiac(ctx, w, h, sign) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#173e48");
  bg.addColorStop(1, "#091b35");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = "#e8f1d833";
    ctx.beginPath();
    ctx.arc(
      (((i * 127) % 997) / 997) * w,
      (((i * 71) % 643) / 643) * h,
      1,
      0,
      7,
    );
    ctx.fill();
  }
  if (!sign) return;
  ctx.strokeStyle = "#ffe4a5aa";
  ctx.lineWidth = Math.max(1.5, w / 500);
  for (const [a, b] of sign.links) {
    ctx.beginPath();
    ctx.moveTo(sign.points[a][0] * w, sign.points[a][1] * h);
    ctx.lineTo(sign.points[b][0] * w, sign.points[b][1] * h);
    ctx.stroke();
  }
  for (const [x, y] of sign.points) {
    ctx.fillStyle = "#fff2bd";
    ctx.shadowColor = "#ffda91";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x * w, y * h, w / 130, 0, 7);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
function wrapped(ctx, text, x, y, width, lineHeight) {
  let line = "",
    row = 0;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > width) {
      ctx.fillText(line, x, y + row * lineHeight);
      line = ch;
      row++;
    } else line += ch;
  }
  if (line) ctx.fillText(line, x, y + row * lineHeight);
}
async function saveStarCard(progress, message, portrait) {
  if (!progress.unlocked || !progress.sign) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = portrait ? 1920 : 1080;
  const ctx = canvas.getContext("2d"),
    h = canvas.height;
  ctx.fillStyle = "#102d3a";
  ctx.fillRect(0, 0, 1080, h);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f3f6df";
  ctx.font = "600 43px system-ui";
  ctx.fillText(
    progress.sign.name +
      " · " +
      copy("stars.cardTitle").replace("{n}", progress.milestone),
    540,
    100,
  );
  ctx.font = "27px system-ui";
  ctx.fillText(
    progress.cardDay +
      " · " +
      progress.birthday.month +
      "/" +
      progress.birthday.day,
    540,
    155,
  );
  const starCanvas = document.createElement("canvas");
  starCanvas.width = 900;
  starCanvas.height = portrait ? 780 : 410;
  paintZodiac(
    starCanvas.getContext("2d"),
    900,
    starCanvas.height,
    progress.sign,
  );
  ctx.drawImage(starCanvas, 90, 200);
  ctx.fillStyle = "#ffe2a5";
  ctx.font = "600 " + (portrait ? 43 : 33) + "px system-ui";
  wrapped(
    ctx,
    message.text,
    540,
    portrait ? 1160 : 690,
    850,
    portrait ? 72 : 51,
  );
  ctx.fillStyle = "#e8f2dc";
  ctx.font = "28px system-ui";
  ctx.fillText(data.brand.slogan, 540, h - 130);
  ctx.font = "21px system-ui";
  ctx.fillText(
    copy(
      message.source === "ai"
        ? "stars.ai"
        : message.source === "server"
          ? "stars.server"
          : "stars.local",
    ),
    540,
    h - 80,
  );
  ctx.fillText(
    "DEMO · " +
      (progress.mode === "demo"
        ? copy("journey.demoResult")
        : copy("text.182")),
    540,
    h - 38,
  );
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw Error("PNG");
  download(
    blob,
    "promy-" +
      progress.sign.id +
      "-" +
      progress.milestone +
      "-" +
      (portrait ? "9x16" : "1x1") +
      ".png",
  );
}
export function openPersonalStars() {
  document.getElementById("personalStars")?.remove();
  const d = document.createElement("dialog");
  d.id = "personalStars";
  d.className = "share-dialog journey-dialog";
  d.innerHTML =
    "<h2>" +
    copy("stars.title") +
    "</h2><p>" +
    copy("stars.intro") +
    '</p><div class="birthday-form"><label>' +
    copy("stars.month") +
    '<select id="birthMonth"><option value="">' +
    copy("stars.selectMonth") +
    "</option></select></label><label>" +
    copy("stars.day") +
    '<select id="birthDay"><option value="">' +
    copy("stars.selectDay") +
    '</option></select></label><button id="applyBirthday">' +
    copy("stars.apply") +
    '</button></div><p class="mini-note">' +
    copy("stars.privacy") +
    '</p><p id="starVisitCount"></p><p id="starVisitMode"></p><div id="starVisitAction"></div><h3 id="zodiacName"></h3><canvas id="birthConstellation" width="800" height="430" class="constellation-canvas"></canvas><p id="starUnlockStatus"></p><section id="starMilestoneCard"></section><p class="mini-note">' +
    copy("stars.noPrize") +
    "</p><button data-close>" +
    copy("journey.close") +
    "</button>";
  const month = d.querySelector("#birthMonth"),
    day = d.querySelector("#birthDay"),
    apply = d.querySelector("#applyBirthday");
  for (let i = 1; i <= 12; i++) month.add(new Option(String(i), String(i)));
  for (let i = 1; i <= 31; i++) day.add(new Option(String(i), String(i)));
  const existing = store.stars(currentClock()).birthday;
  if (existing) {
    month.value = existing.month;
    day.value = existing.day;
  }
  function validate() {
    const m = Number(month.value),
      max = m ? [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] : 31;
    for (const o of day.options) o.disabled = Number(o.value) > max;
    if (Number(day.value) > max) day.value = "";
    apply.disabled =
      spectate || !validBirthday({ month: m, day: Number(day.value) });
  }
  month.onchange = validate;
  day.onchange = validate;
  apply.onclick = () =>
    store.act(
      "setBirthday",
      { month: Number(month.value), day: Number(day.value) },
      currentClock(),
    );
  validate();
  if (demonstration && !spectate) {
    const add = document.createElement("button");
    add.id = "addStarVisit";
    add.textContent = copy("stars.demoAdd");
    add.onclick = () => store.act("demoVisit", null, currentClock());
    const reset = document.createElement("button");
    reset.id = "resetPersonalStars";
    reset.textContent = copy("stars.reset");
    reset.onclick = () => store.act("resetDemoStars", null, currentClock());
    d.querySelector("#starVisitAction").append(add, reset);
  }
  let cardKey = "",
    abort = null;
  function render() {
    const p = store.stars(currentClock());
    d.querySelector("#starVisitCount").textContent = copy(
      "stars.visits",
    ).replace("{n}", p.visits);
    d.querySelector("#starVisitMode").textContent = copy(
      demonstration ? "stars.demo" : "stars.real",
    );
    d.querySelector("#zodiacName").textContent = p.sign
      ? p.sign.name + " · " + copy("stars.preview")
      : copy("stars.empty");
    paintZodiac(d.querySelector("canvas").getContext("2d"), 800, 430, p.sign);
    d.querySelector("#starUnlockStatus").textContent = !p.unlocked
      ? copy("stars.locked").replace("{n}", 100 - p.visits)
      : !p.sign
        ? copy("stars.needBirthday")
        : "";
    const key =
      p.sign && p.unlocked
        ? [
            p.mode,
            p.sign.id,
            p.birthday.month,
            p.birthday.day,
            p.milestone,
            p.cardDay,
          ].join(":")
        : "";
    if (key === cardKey) return;
    cardKey = key;
    abort?.abort();
    const section = d.querySelector("#starMilestoneCard");
    section.replaceChildren();
    if (!key) return;
    const heading = document.createElement("h3"),
      date = document.createElement("p"),
      text = document.createElement("p"),
      origin = document.createElement("p");
    heading.textContent = copy("stars.cardTitle").replace("{n}", p.milestone);
    date.textContent = copy("stars.cardDate")
      .replace("{day}", p.cardDay)
      .replace("{n}", p.remaining);
    text.className = "star-message";
    text.id = "personalStarMessage";
    origin.className = "mini-note";
    section.append(heading, date, text, origin);
    let message = { text: composeStarMessage(p), source: "local" };
    function show(value) {
      message = value;
      text.textContent = value.text;
      origin.textContent = copy(
        value.source === "ai"
          ? "stars.ai"
          : value.source === "server"
            ? "stars.server"
            : "stars.local",
      );
    }
    show(message);
    for (const [portrait, label] of [
      [true, "stars.savePortrait"],
      [false, "stars.saveSquare"],
    ]) {
      const b = document.createElement("button");
      b.textContent = copy(label);
      b.dataset.starDownload = portrait ? "portrait" : "square";
      b.onclick = async () => {
        b.disabled = true;
        try {
          await saveStarCard(p, message, portrait);
        } finally {
          b.disabled = false;
        }
      };
      section.append(b);
    }
    if (data.brand.starMessageEndpoint) {
      abort = new AbortController();
      const current = abort;
      starMessage(p, data.brand.starMessageEndpoint, current.signal).then(
        (value) => {
          if (!current.signal.aborted && d.open && cardKey === key) show(value);
        },
      );
    }
  }
  const unsub = store.subscribe(render);
  d.querySelector("[data-close]").onclick = () => d.close();
  d.addEventListener(
    "close",
    () => {
      abort?.abort();
      unsub();
    },
    { once: true },
  );
  document.body.append(d);
  render();
  d.showModal();
}
