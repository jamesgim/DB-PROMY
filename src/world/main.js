import { copy } from "../data/copy.js";
import * as T from "three";
import { loadAssets } from "./assets.js";
import { buildZones, locations } from "./zones.js";
import { createSky } from "./sky.js";
import { controls } from "./controls.js";
import { store, currentClock, demo, spectate } from "../systems/runtime.js";
import { mountCampaign } from "../ui/campaign.js";
import { toast } from "../ui/daily.js";
import { setCapture, setVideoSource } from "../ui/share.js";
import { postprocessing } from "./post.js";
import { createJourneyWorld } from "./journey.js";
export async function startWorld() {
  const $ = (id) => document.getElementById(id),
    params = new URLSearchParams(location.search);
  let low =
    params.get("quality") === "low" ||
    matchMedia("(max-width:900px)").matches ||
    (navigator.hardwareConcurrency ?? 8) <= 4;
  const renderer = new T.WebGLRenderer({
    antialias: !low,
    alpha: true,
    powerPreference: low ? "low-power" : "high-performance",
    preserveDrawingBuffer: false,
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.5));
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = T.SRGBColorSpace;
  $("viewport").append(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", copy("text.096"));
  const scene = new T.Scene();
  scene.background = new T.Color(0x88bcb4);
  scene.fog = new T.FogExp2(0x88bcb4, 0.007);
  const camera = new T.PerspectiveCamera(
    59,
    innerWidth / innerHeight,
    0.1,
    220,
  );
  camera.position.set(10, 15, 20);
  const composer = low ? null : postprocessing(renderer, scene, camera);
  renderer.info.autoReset = false;
  const assets = await loadAssets(
    (p) =>
      ($("loadText").textContent =
        copy("text.097") + Math.round(p * 100) + "%"),
  );
  const player = assets.actor("player");
  player.root.scale.setScalar(0.43);
  player.root.position.set(1, 0, 6);
  player.play("idle");
  scene.add(player.root);
  const accent = assets.clone("lantern-floor");
  accent.position.set(0.75, 0.8, -0.35);
  accent.scale.setScalar(0.5);
  const accents = [0xb5d8b4, 0xffe7a5, 0xe5f1b2, 0xf1c4c4, 0xc0deef, 0xd5c3e6];
  accent.traverse((o) => {
    if (o.isMesh) {
      o.material = o.material.clone();
      o.material.color.setHex(accents[store.state.variant]);
    }
  });
  player.root.add(accent);
  const neighbors = [];
  for (let i = 0; i < (low ? 1 : 2); i++) {
    const actor = assets.actor("promy");
    actor.root.position.set(i ? 10 : 0, 0, i ? -6 : -5);
    actor.root.scale.setScalar(0.48);
    if (i) {
      actor.root.getObjectByName("PostmasterHat").visible = false;
      actor.root.getObjectByName("PostmasterBag").visible = false;
    }
    actor.play("idle");
    scene.add(actor.root);
    neighbors.push(actor);
  }
  let input,
    zones,
    ritualUntil = 0,
    cheerUntil = 0;
  const started = performance.now();
  const effects = new T.Points(
    new T.BufferGeometry().setAttribute(
      "position",
      new T.Float32BufferAttribute(
        Array.from({ length: 70 }, (_, i) => [
          Math.sin(i * 2.4) * (2 + (i % 4)),
          1 + (i % 5),
          Math.cos(i * 2.4) * (2 + (i % 4)),
        ]).flat(),
        3,
      ),
    ),
    new T.PointsMaterial({
      color: 0xffdf9e,
      size: 0.15,
      transparent: true,
      opacity: 0,
    }),
  );
  scene.add(effects);
  function cinematic(title, sub) {
    $("cinematicTitle").textContent = title;
    $("cinematicSub").textContent = sub;
    $("cinematic").classList.add("show");
    clearTimeout(cinematic.timer);
    cinematic.timer = setTimeout(
      () => $("cinematic").classList.remove("show"),
      4500,
    );
  }
  function celebrate(type) {
    player.play(
      type === "star" ? "cheer" : type === "hello" ? "wave" : "fold_paper",
      true,
    );
    neighbors.forEach((n) => n.play("cheer", true));
    cheerUntil = performance.now() + 2800;
    effects.position.copy(player.root.position);
    $("beat" + (type === "star" ? 3 : type === "hello" ? 2 : 1)).classList.add(
      "on",
    );
    cinematic(
      type === "star"
        ? copy("text.066")
        : type === "hello"
          ? copy("text.098")
          : copy("text.099"),
      type === "star"
        ? copy("text.100")
        : type === "hello"
          ? copy("text.101")
          : copy("text.102"),
    );
  }
  const actions = mountCampaign({
    onPromise: () => celebrate("lantern"),
    onFinish: () => celebrate("star"),
    onHello: () => celebrate("hello"),
    onExplore: () => {
      input.view = null;
      input.distance = 32;
      input.yaw += Math.PI / 2;
      toast(copy("text.103"));
    },
  });
  zones = buildZones(scene, assets, actions, low);
  const sky = createSky(scene, low);
  const journeyWorld = createJourneyWorld(scene);
  input = controls(renderer, player.root, camera, {
    targets: zones.targets,
    modalOpen: () =>
      $("modal").classList.contains("open") ||
      !!document.querySelector("dialog[open]"),
    onInteract: (e) => {
      const p = new T.Vector2(
          (e.clientX / innerWidth) * 2 - 1,
          (-e.clientY / innerHeight) * 2 + 1,
        ),
        ray = new T.Raycaster();
      ray.setFromCamera(p, camera);
      const hit = new T.Vector3();
      if (ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), hit)) {
        const target = zones.targets.find(
          (t) => t.at.distanceTo(hit) < t.radius,
        );
        target?.click();
      }
    },
  });
  const ritual = () => {
    ritualUntil = performance.now() + 10000;
    neighbors[0].root.position.set(0, 0, -5);
    neighbors[0].play("lantern_add", true);
    cinematic(copy("text.104"), copy("text.105"));
    toast(copy("text.060"));
  };
  window.addEventListener("promy:ritual", ritual);
  window.addEventListener("promy:milestone", () => {
    if (demo.milestone === 100) {
      player.play("cheer", true);
      neighbors[0].play("cheer", true);
      cinematic(copy("text.106"), copy("text.107"));
      input.distance = 22;
      player.root.position.set(0, 0, 37);
      neighbors[0].root.position.set(-3, 0, 37);
      setTimeout(() => neighbors[0].root.position.set(0, 0, -5), 10000);
    }
  });
  window.addEventListener("promy:reward", (e) => {
    if (e.detail === 100) {
      demo.milestone = 100;
      window.dispatchEvent(new Event("promy:milestone"));
      setTimeout(() => (demo.milestone = 0), 10000);
    } else celebrate("star");
  });
  window.addEventListener("promy:home", () => {
    input.view = null;
    player.root.position.set(0, 0, 40);
    input.yaw = 0.05;
    input.pitch = 0.55;
    input.distance = 12;
    toast(copy("text.108"));
  });
  let lastCheck = store.summary(currentClock()).flags.join(",");
  store.subscribe(() => {
    const next = store.summary(currentClock()).flags.join(",");
    if (next !== lastCheck) {
      player.play("check_in", true);
      lastCheck = next;
    }
  });
  window.addEventListener("promy:care", () => {
    player.play("check_in", true);
  });
  window.addEventListener("promy:towers", () => {
    input.view = "towers";
  });
  window.addEventListener("promy:stars", () => {
    input.view = "stars";
  });
  window.addEventListener("promy:stone", (e) => {
    player.play("cheer", true);
    cheerUntil = performance.now() + 1200;
    effects.position.copy(player.root.position);
    input.view = "towers";
    if (e.detail.stones % 100 === 0) {
      neighbors.forEach((n) => n.play("cheer", true));
      cinematic(
        copy(e.detail.yearComplete ? "journey.annual" : "journey.hundred"),
        copy("journey.goal")
          .replace("{n}", e.detail.stones)
          .replace("{t}", e.detail.towers),
      );
    }
  });
  $("soundBtn").onclick = () => toast(copy("text.109"));
  $("reset").onclick = () => {
    if (!spectate && confirm(copy("text.110"))) {
      store.act(store.demonstration ? "resetDemo" : "reset");
      location.reload();
    }
  };
  $("nightBtn").textContent = copy("text.111");
  $("nightBtn").onclick = () =>
    (location.href = "./fallback.html" + location.search);
  let last = performance.now(),
    frames = 0,
    elapsed = 0,
    performanceChecked = false,
    raf;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const c = currentClock(),
      s = zones.update(c, demo.milestone);
    input.update(dt);
    const journey = journeyWorld.update(camera, now, input.view);
    if (cheerUntil < now) player.play(input.moving ? "walk" : "idle");
    player.mixer.update(dt);
    neighbors.forEach((n, i) => {
      if (i) {
        const t = now / 3500;
        n.root.position.set(10 + Math.cos(t) * 2, 0, -6 + Math.sin(t) * 2);
        n.root.rotation.y = -t;
        n.play("walk");
      }
      n.mixer.update(dt);
    });
    sky.update(c, s, dt, now < ritualUntil);
    effects.material.opacity = Math.max(0, (cheerUntil - now) / 2800);
    effects.rotation.y += dt * 0.5;
    effects.position.y += dt * 0.3;
    const zone = locations
      .slice()
      .sort(
        (a, b) =>
          Math.hypot(
            player.root.position.x - a[2],
            player.root.position.z - a[3],
          ) -
          Math.hypot(
            player.root.position.x - b[2],
            player.root.position.z - b[3],
          ),
      )[0];
    $("zoneLabel").textContent = "✦ " + zone[0];
    $("statusName").textContent = copy("text.025");
    $("statusText").textContent = s.flags.length
      ? copy("text.112")
      : copy("text.113");
    zones.dogs.forEach((d) => d.mixer.update(dt));
    assets.glow.value = now < ritualUntil ? 2 : c.hour >= 18 ? 0.7 : 0;
    renderer.info.reset();
    if (composer && !low) composer.render();
    else renderer.render(scene, camera);
    frames++;
    elapsed += (now - (frame.previous ?? now)) / 1000;
    frame.previous = now;
    if (!performanceChecked && now - started > 3500) {
      performanceChecked = true;
      const fps = frames / Math.max(1, elapsed);
      if (fps < 30 && !low) {
        low = true;
        renderer.shadowMap.enabled = false;
        renderer.setPixelRatio(1);
        sky.low();
        neighbors.slice(1).forEach((n) => (n.root.visible = false));
        toast(copy("text.114"));
      }
    }
    if (params.get("qa") === "1")
      window.__PROMY_QA__ = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        points: renderer.info.render.points,
        pointLights: sky.lights.length,
        quality: low ? "low" : "desktop",
        player: [player.root.position.x, player.root.position.z],
        camera: camera.position.toArray(),
        view: input.view ?? null,
        homeLit: s.flags.slice(),
        ritual: now < ritualUntil,
        phase: c.phase,
        models: ["player", "promy"],
        playerHeight: new T.Box3()
          .setFromObject(player.root)
          .getSize(new T.Vector3()).y,
        hasCampfire: !!scene.getObjectByName("Campfire"),
        journey: {
          stones: journey.stones,
          slots: journey.slots,
          visits: store.stars(currentClock()).visits,
          available: journey.available.length,
          mode: journey.mode,
        },
      };
  }
  setCapture(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 720;
    const r = new T.WebGLRenderer({
      canvas: c,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    r.setSize(720, 720);
    r.setClearColor(0, 0);
    r.outputColorSpace = T.SRGBColorSpace;
    const shot = new T.Scene(),
      model = assets.clone("player");
    shot.add(model, new T.HemisphereLight(0xffffff, 0x486d54, 2.5));
    const light = new T.DirectionalLight(0xffedcf, 3);
    light.position.set(-3, 7, 5);
    shot.add(light);
    const cam = new T.PerspectiveCamera(36, 1, 0.1, 30);
    cam.position.set(0, 2.5, 9);
    cam.lookAt(0, 2.4, 0);
    r.render(shot, cam);
    const output = document.createElement("canvas");
    output.width = output.height = 720;
    output.getContext("2d").drawImage(c, 0, 0);
    r.dispose();
    r.forceContextLoss();
    return output;
  });
  setVideoSource(() => {
    const r = new T.WebGLRenderer({
      antialias: false,
      preserveDrawingBuffer: true,
    });
    r.setSize(540, 960);
    r.outputColorSpace = T.SRGBColorSpace;
    r.toneMapping = T.ACESFilmicToneMapping;
    const cam = new T.PerspectiveCamera(60, 540 / 960, 0.1, 220);
    return {
      frame(t) {
        cam.position.set(0, 12 + t * 0.25, 32);
        cam.lookAt(0, 2 + Math.min(27, t) * 2.7, -2);
        r.render(scene, cam);
        return r.domElement;
      },
      dispose() {
        r.dispose();
        r.forceContextLoss();
      },
    };
  });
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer?.setSize(innerWidth, innerHeight);
  });
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    location.replace("./fallback.html" + location.search);
  });
  $("loading").style.display = "none";
  requestAnimationFrame(frame);
  return { ritual };
}
