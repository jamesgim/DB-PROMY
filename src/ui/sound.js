import { copy } from "../data/copy.js";
export function mountSound(panel, toast) {
  if (document.getElementById("promyBgm")) return;
  let button = document.getElementById("soundBtn");
  if (!button) {
    button = document.createElement("button");
    button.id = "soundBtn";
    panel.prepend(button);
  }
  const audio = document.createElement("audio");
  audio.id = "promyBgm";
  audio.src = new URL(
    "../../assets/audio/jigeum-geudaero.mp3",
    import.meta.url,
  ).href;
  audio.loop = true;
  audio.preload = "metadata";
  audio.volume = 0.4;
  document.body.append(audio);
  button.title = copy("audio.title");
  const update = () => {
    button.textContent = copy(audio.paused ? "audio.off" : "audio.on");
    button.setAttribute("aria-pressed", String(!audio.paused));
  };
  audio.addEventListener("play", update);
  audio.addEventListener("pause", update);
  audio.addEventListener("error", () => {
    button.disabled = false;
    update();
  });
  button.onclick = async () => {
    if (!audio.paused) {
      audio.pause();
      toast(copy("audio.paused"));
      return;
    }
    button.disabled = true;
    button.textContent = copy("audio.loading");
    try {
      await audio.play();
      toast(copy("audio.playing"));
    } catch {
      toast(copy("audio.failed"));
    } finally {
      button.disabled = false;
      update();
    }
  };
  update();
}
