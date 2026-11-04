import { copy } from "../data/copy.js";
import { store, data, currentClock, spectate } from "../systems/runtime.js";
import { toast } from "./daily.js";
export function mountCampaign({
  onPromise = () => {},
  onFinish = () => {},
  onHello = () => {},
  onExplore = () => {},
} = {}) {
  const $ = (id) => document.getElementById(id);
  let chosen = 0,
    previousFocus;
  const modal = $("modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modalTitle");
  function close() {
    modal.classList.remove("open");
    previousFocus?.focus();
  }
  function open(title, description, content) {
    previousFocus = document.activeElement;
    $("modalTitle").textContent = title;
    $("modalDesc").textContent = description;
    $("modalContent").replaceChildren(content);
    modal.classList.add("open");
    $("closeModal").focus();
  }
  function promise() {
    if (spectate) return;
    const body = document.createElement("div");
    body.innerHTML =
      '<div class="choice-grid">' +
      data.categories
        .map(
          (x, i) =>
            '<button data-category="' +
            i +
            '" class="' +
            (i === chosen ? "chosen" : "") +
            '"><b>' +
            x.name +
            "</b>" +
            x.description +
            "</button>",
        )
        .join("") +
      copy("text.008");
    body.querySelector("#seal").textContent = copy("text.009");
    body.querySelectorAll("[data-category]").forEach(
      (b) =>
        (b.onclick = () => {
          chosen = Number(b.dataset.category);
          body
            .querySelectorAll("[data-category]")
            .forEach((x) => x.classList.toggle("chosen", x === b));
        }),
    );
    body.querySelector("#seal").onclick = () => {
      if (store.act("promise", chosen, currentClock())) {
        close();
        onPromise();
        toast(copy("text.010"));
      } else toast(copy("text.011"));
    };
    open(copy("text.012"), copy("text.013"), body);
  }
  function finish() {
    if (spectate) return;
    if (!store.state.pending.length) {
      toast(copy("text.014"));
      return;
    }
    const body = document.createElement("div");
    body.innerHTML =
      '<div class="letter-card"><b>' +
      data.categories[store.state.pending[0]].name +
      copy("text.015");
    body.querySelector("#keep").onclick = () => {
      if (store.act("finish", null, currentClock())) {
        close();
        onFinish();
        toast(copy("text.016"));
      }
    };
    body.querySelector("#retry").onclick = () => {
      close();
      toast(copy("text.017"));
    };
    open(copy("text.018"), copy("text.019"), body);
  }
  function hello() {
    if (spectate) return;
    onHello();
    toast(copy("text.020"));
  }
  function chat() {
    if (spectate) return;
    const body = document.createElement("div");
    body.innerHTML = copy("text.021");
    body.querySelector("#chatPromise").onclick = promise;
    body.querySelector("#chatFinish").onclick = finish;
    open(copy("text.022"), copy("text.023"), body);
  }
  $("actPromise").onclick = promise;
  $("actFinish").onclick = finish;
  $("actHello").onclick = hello;
  $("actPromy").onclick = chat;
  $("actExplore").onclick = onExplore;
  $("closeModal").onclick = close;
  modal.onclick = (e) => {
    if (e.target === modal) close();
  };
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const focus = [
        ...modal.querySelectorAll("button:not(:disabled),a[href]"),
      ];
      const first = focus[0],
        last = focus.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  function hud() {
    $("total").textContent = store.state.done + " STARS";
    $("pending").textContent = store.state.pending.length;
    const rate = Math.round(
      (store.state.done /
        Math.max(1, store.state.done + store.state.pending.length)) *
        100,
    );
    $("progress").style.width = rate + "%";
    $("percent").textContent = copy("text.024");
    $("identity").textContent = "✦ " + store.state.name;
  }
  store.subscribe(hud);
  hud();
  return { promise, finish, hello, chat, close };
}
