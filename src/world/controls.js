import * as T from "three";
import { spectate } from "../systems/runtime.js";
export function controls(
  renderer,
  player,
  camera,
  { targets, onInteract, modalOpen },
) {
  const input = {
    yaw: 0.65,
    pitch: 0.68,
    distance: spectate ? 48 : 13,
    keys: {},
    joy: { x: 0, y: 0 },
    near: null,
    moving: false,
  };
  const clamp = T.MathUtils.clamp;
  function interact() {
    if (!spectate && !modalOpen()) {
      input.near?.click();
    }
  }
  document.getElementById("mobileInteract").onclick = interact;
  window.addEventListener("keydown", (e) => {
    if (e.target.closest("button,select,dialog") || modalOpen() || spectate)
      return;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        e.code,
      )
    )
      e.preventDefault();
    input.keys[e.code] = true;
    if (e.code === "KeyE" && !e.repeat) interact();
  });
  window.addEventListener("keyup", (e) => (input.keys[e.code] = false));
  window.addEventListener("blur", () => {
    input.keys = {};
    stop();
  });
  const canvas = renderer.domElement;
  canvas.style.touchAction = "none";
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, total: 0 };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    drag.total += Math.abs(dx) + Math.abs(dy);
    input.yaw -= dx * 0.005;
    input.pitch = clamp(input.pitch + dy * 0.003, 0.23, 1.23);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (drag?.id === e.pointerId && drag.total < 8 && !spectate) onInteract(e);
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => (drag = null));
  canvas.addEventListener(
    "wheel",
    (e) => {
      input.distance = clamp(input.distance + e.deltaY * 0.012, 7, 60);
    },
    { passive: true },
  );
  const joystick = document.getElementById("joystick"),
    knob = document.getElementById("joyKnob");
  let joyId = null;
  function updateJoy(e) {
    if (e.pointerId !== joyId) return;
    const r = joystick.getBoundingClientRect(),
      dx = (e.clientX - r.left - r.width / 2) / 38,
      dy = (e.clientY - r.top - r.height / 2) / 38,
      l = Math.max(1, Math.hypot(dx, dy));
    input.joy = { x: dx / l, y: dy / l };
    knob.style.transform = `translate(${(dx / l) * 30}px,${(dy / l) * 30}px)`;
  }
  function stop() {
    joyId = null;
    input.joy = { x: 0, y: 0 };
    knob.style.transform = "";
  }
  joystick.addEventListener("pointerdown", (e) => {
    if (spectate) return;
    joyId = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    updateJoy(e);
  });
  joystick.addEventListener("pointermove", updateJoy);
  joystick.addEventListener("pointerup", stop);
  joystick.addEventListener("pointercancel", stop);
  joystick.addEventListener("lostpointercapture", stop);
  for (const [id, delta] of [
    ["zoomIn", -3],
    ["zoomOut", 3],
  ])
    document.getElementById(id).onclick = () =>
      (input.distance = clamp(input.distance + delta, 7, 60));
  input.update = (dt) => {
    const k = input.keys;
    let x =
        (k.KeyD || k.ArrowRight ? 1 : 0) -
        (k.KeyA || k.ArrowLeft ? 1 : 0) +
        input.joy.x,
      z =
        (k.KeyS || k.ArrowDown ? 1 : 0) -
        (k.KeyW || k.ArrowUp ? 1 : 0) +
        input.joy.y;
    const l = Math.hypot(x, z);
    input.moving = l > 0.1 && !spectate && !modalOpen();
    if (input.moving) input.view = null;
    if (input.view === "towers" || input.view === "stars") {
      const stars = input.view === "stars",
        dest = stars ? new T.Vector3(0, 12, 21) : new T.Vector3(12, 10, 23),
        target = stars ? new T.Vector3(0, 17, -13) : new T.Vector3(0, 2.5, 6);
      camera.position.lerp(dest, 1 - Math.exp(-4 * dt));
      camera.lookAt(target);
      document.getElementById("nearPrompt").classList.remove("show");
      input.near = null;
      return;
    }
    if (input.moving) {
      x /= l;
      z /= l;
      const dx = Math.cos(input.yaw) * x + Math.sin(input.yaw) * z,
        dz = -Math.sin(input.yaw) * x + Math.cos(input.yaw) * z;
      player.position.x = clamp(player.position.x + dx * dt * 6, -48, 48);
      player.position.z = clamp(player.position.z + dz * dt * 6, -43, 43);
      player.rotation.y = Math.atan2(dx, dz);
    }
    const target = spectate
      ? new T.Vector3(0, 2, 0)
      : player.position.clone().add(new T.Vector3(0, 1.0, 0));
    if (spectate) input.yaw += dt * 0.035;
    const horizontal = input.distance * Math.cos(input.pitch);
    const dest = target
      .clone()
      .add(
        new T.Vector3(
          Math.sin(input.yaw) * horizontal,
          input.distance * Math.sin(input.pitch),
          Math.cos(input.yaw) * horizontal,
        ),
      );
    camera.position.lerp(dest, 1 - Math.exp(-5 * dt));
    camera.lookAt(target);
    input.near = spectate
      ? null
      : targets
          .filter((t) => t.at.distanceTo(player.position) < t.radius)
          .sort(
            (a, b) =>
              a.at.distanceTo(player.position) -
              b.at.distanceTo(player.position),
          )[0];
    document
      .getElementById("nearPrompt")
      .classList.toggle("show", !!input.near);
    if (input.near)
      document.getElementById("nearName").textContent = input.near.name;
  };
  return input;
}
