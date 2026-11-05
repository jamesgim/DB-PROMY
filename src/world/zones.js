import { copy } from "../data/copy.js";
import * as T from "three";
import { store, data } from "../systems/runtime.js";
export const locations = [
  [copy("text.053"), copy("text.115"), 0, -1.3],
  [copy("text.116"), copy("text.117"), -18, -13],
  [copy("text.118"), copy("text.119"), 18, -13],
  [copy("text.120"), copy("text.121"), -18, 13],
  [copy("text.122"), copy("text.123"), 18, 13],
];
const rnd = (i) => {
  const v = Math.sin(i * 127.1 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function sign(text, w = 5) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const x = c.getContext("2d");
  x.fillStyle = "#f2f1df";
  x.fillRect(0, 0, 512, 96);
  x.fillStyle = "#17543c";
  x.font = "bold 42px system-ui";
  x.textAlign = "center";
  x.fillText(text, 256, 62);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  const s = new T.Sprite(new T.SpriteMaterial({ map, depthWrite: false }));
  s.scale.set(w, (w * 96) / 512, 1);
  return s;
}
export function buildZones(scene, assets, actions, low) {
  const ground = new T.Mesh(
    new T.CircleGeometry(62, 64),
    new T.MeshStandardMaterial({ color: 0x88a982, flatShading: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  const path = new T.Mesh(
    new T.CircleGeometry(11, 48),
    new T.MeshStandardMaterial({ color: 0xc9bfa8 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.015;
  scene.add(path);
  const strips = new T.InstancedMesh(
    new T.BoxGeometry(8, 0.08, 55),
    new T.MeshStandardMaterial({ color: 0xc9bfa8 }),
    2,
  );
  const dummy = new T.Object3D();
  for (let i = 0; i < 2; i++) {
    dummy.rotation.y = (i * Math.PI) / 2;
    dummy.position.y = 0;
    dummy.updateMatrix();
    strips.setMatrixAt(i, dummy.matrix);
  }
  strips.receiveShadow = true;
  scene.add(strips);
  const batches = {};
  function at(name, x, z, s = 1, r = 0, y = 0) {
    (batches[name] ??= []).push({ x, z, s, r, y });
  }
  const mail = assets.clone("mailbox");
  mail.scale.setScalar(0.8);
  mail.position.set(0, 0, -1.3);
  scene.add(mail);
  at("postoffice", 0, -24, 1.1);
  const title = sign(copy("text.075"), 6);
  title.position.set(0, 5, -19.5);
  scene.add(title);
  at("fountain", -18, -13, 1.3);
  at("sports", 18, -13);
  at("crosswalk", -18, 13);
  at("house-1", 18, 13);
  at("dinner", 18, 19.5);
  at("arch", 0, 25);
  at("bunting", 18, 20, 1.3);
  locations.slice(1).forEach(([name, , x, z]) => {
    const label = sign(name);
    label.position.set(x, 5, z - 5);
    scene.add(label);
  });
  const dogs = [0, 1].map((i) => {
    const d = assets.actor("dog");
    d.root.position.set(-21 + i * 5, 0, -12);
    d.play("dog_walk");
    scene.add(d.root);
    return d;
  });
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    at("bench", Math.cos(a) * 16, Math.sin(a) * 16, 1, -a + Math.PI / 2);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI * 2) / 16;
    at("fence", Math.cos(a) * 31, Math.sin(a) * 31, 1, -a);
  }
  for (let i = 0; i < (low ? 60 : 110); i++) {
    const a = rnd(i + 22) * Math.PI * 2,
      r = 32 + rnd(i + 33) * 22;
    at(
      "tree-" + (i % 3),
      Math.cos(a) * r,
      Math.sin(a) * r,
      0.7 + rnd(i + 44) * 0.7,
      a,
    );
  }
  for (let i = 0; i < (low ? 70 : 150); i++) {
    const x = (rnd(i + 200) - 0.5) * 98,
      z = (rnd(i + 700) - 0.5) * 85;
    if (
      Math.abs(x) < 6 ||
      Math.abs(z) < 6 ||
      locations.some((a) => Math.hypot(a[2] - x, a[3] - z) < 8) ||
      Math.hypot(x, z - 31) < 8
    )
      continue;
    at(
      i % 3 === 0 ? "bush-" + (i % 2) : "flower",
      x,
      z,
      0.8 + rnd(i + 300) * 0.6,
    );
  }
  const houses = [
    [-27, -25],
    [27, -25],
    [-30, 24],
    [30, 27],
    [-12, 32],
    [12, 33],
  ];
  houses.forEach(([x, z], i) => {
    at("house-" + (i % 3), x, z, 0.8);
  });
  const staticBatches = {};
  for (const [name, transforms] of Object.entries(batches)) {
    if (/^(tree|bush|flower|seat)/.test(name))
      scene.add(assets.instances(name, transforms, { shadow: false }));
    else staticBatches[name] = transforms;
  }
  scene.add(assets.scenery(staticBatches));
  const home = assets.clone("house-" + (store.state.house % 3));
  home.position.set(0, 0, 33);
  scene.add(home);
  const homeLabel = sign(copy("text.124") + store.state.name, 7);
  homeLabel.position.set(0, 6, 33);
  scene.add(homeLabel);
  const homeMaterials = {};
  for (const name of ["Windows", "MealLight", "DoorLight"]) {
    home.getObjectByName(name)?.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.emissive = new T.Color(0xffd18b);
        homeMaterials[name] = o.material;
      }
    });
  }
  const gold = assets.clone("lantern");
  gold.position.set(3.5, 0, 35);
  gold.scale.setScalar(1.5);
  gold.visible = false;
  scene.add(gold);
  const honor = sign(store.state.name, 6);
  honor.position.set(-7, 3, -4);
  honor.visible = false;
  scene.add(honor);
  const tree = assets.instances("tree-1", [{ x: -4, z: 34, s: 0.8 }]);
  tree.visible = false;
  scene.add(tree);
  const upstairs = assets.clone("house-0");
  upstairs.position.set(0, 3, 33);
  upstairs.scale.setScalar(0.75);
  upstairs.visible = false;
  scene.add(upstairs);
  const smoke = new T.Points(
    new T.BufferGeometry().setAttribute(
      "position",
      new T.Float32BufferAttribute(
        Array.from({ length: 24 }, (_, i) => [
          -1.8 + Math.sin(i) * 0.3,
          6 + i * 0.15,
          32 + Math.cos(i) * 0.2,
        ]).flat(),
        3,
      ),
    ),
    new T.PointsMaterial({
      color: 0xe7e1d1,
      size: 0.22,
      transparent: true,
      opacity: 0.4,
    }),
  );
  smoke.visible = false;
  scene.add(smoke);
  let lanterns;
  function syncLanterns() {
    if (lanterns) {
      scene.remove(lanterns);
      lanterns.dispose();
    }
    const count = 16 + store.state.pending.length;
    lanterns = assets.instances(
      "lantern",
      Array.from({ length: count }, (_, i) => {
        const a = (i * Math.PI * 2) / count,
          r = 6 + (i % 3) * 0.8;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r };
      }),
    );
    scene.add(lanterns);
  }
  const targets = locations.map(([name, , x, z], i) => ({
    name,
    at: new T.Vector3(x, 0, z),
    radius: i ? 7 : 4.3,
    click: [
      actions.promise,
      actions.hello,
      () => {
        actions.hello();
      },
      actions.promise,
      actions.promise,
    ][i],
  }));
  targets.push(
    {
      name: copy("text.125"),
      at: new T.Vector3(0, 0, 33),
      radius: 6,
      click: () =>
        document.querySelector("[data-checkin]:not(:disabled)")?.focus(),
    },
    {
      name: copy("care.station"),
      at: new T.Vector3(0, 0, 7),
      radius: 3,
      click: () => {
        const button = document.querySelector("#placeStone:not(:disabled)");
        if (button) button.click();
        else document.querySelector("[data-care]")?.focus();
      },
    },
  );
  let pending = -1;
  function update(clock, milestone = 0) {
    const s = store.summary(clock);
    const level = Math.max(s.total, milestone);
    if (pending !== store.state.pending.length) {
      pending = store.state.pending.length;
      syncLanterns();
    }
    for (const [name, id] of [
      ["MealLight", "meal"],
      ["DoorLight", "day"],
      ["Windows", "home"],
    ]) {
      const m = homeMaterials[name];
      if (m) {
        const lit = s.flags.includes(id) || s.flags.includes("care");
        m.emissiveIntensity = lit ? 1.1 : 0;
        m.color.set(lit ? 0xffffff : 0x777777);
      }
    }
    gold.visible = level >= 100;
    honor.visible = level >= 100;
    tree.visible = level >= 30;
    smoke.visible = level >= 7;
    upstairs.visible = level >= 365;
    return s;
  }
  return {
    home,
    mail,
    dogs,
    targets,
    update,
    get lanterns() {
      return lanterns;
    },
  };
}
