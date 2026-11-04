import * as T from "three";
import { store, currentClock } from "../systems/runtime.js";

import { copy } from "../data/copy.js";
const CENTERS = [
  [-5, 7],
  [0, 3],
  [5, 7],
];
function stoneTransform(index) {
  const layer = Math.floor(index / 5),
    slot = index % 5,
    taper = 1 - layer * 0.032,
    angle = (slot * Math.PI * 2) / 5 + layer * 0.46;
  return {
    x: Math.cos(angle) * 0.85 * taper,
    y: 0.34 + layer * 0.255,
    z: Math.sin(angle) * 0.85 * taper,
    sx: (0.64 + (index % 3) * 0.06) * taper,
    sy: 0.17,
    sz: 0.48 * taper,
    rotation: angle + 0.2,
  };
}
export function createJourneyWorld(scene) {
  const geo = new T.DodecahedronGeometry(1, 0),
    material = new T.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      flatShading: true,
    }),
    dummy = new T.Object3D();
  const bases = new T.InstancedMesh(
    new T.CylinderGeometry(1.7, 1.85, 0.22, 20),
    new T.MeshStandardMaterial({ color: 0x17543c, roughness: 1 }),
    3,
  );
  CENTERS.forEach(([x, z], i) => {
    dummy.position.set(x, 0.11, z);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    bases.setMatrixAt(i, dummy.matrix);
  });
  scene.add(bases);
  const towers = CENTERS.map(([x, z], tower) => {
    const m = new T.InstancedMesh(geo, material, 100);
    m.name = "PromiseTower" + (tower + 1);
    m.position.set(x, 0, z);
    m.frustumCulled = false;
    for (let i = 0; i < 100; i++) {
      const p = stoneTransform(i);
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.rotation.set((i % 3) * 0.13, p.rotation, (i % 2) * 0.08);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(
        i,
        new T.Color(
          i === 99 ? 0xffda91 : [0xb7baa8, 0xc9c9b5, 0xa2aa9a, 0xdbd5c2][i % 4],
        ),
      );
    }
    m.count = 0;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  });
  const labels = document.createElement("div");
  labels.className = "world-tower-labels";
  const badges = CENTERS.map(() => {
    const b = document.createElement("span");
    labels.append(b);
    return b;
  });
  (document.getElementById("app") ?? document.body).append(labels);
  const sg = new T.BufferGeometry(),
    lg = new T.BufferGeometry();
  sg.setAttribute("position", new T.Float32BufferAttribute([], 3));
  lg.setAttribute("position", new T.Float32BufferAttribute([], 3));
  const stars = new T.Points(
    sg,
    new T.PointsMaterial({ color: 0xffda91, size: 0.18 }),
  );
  scene.add(stars);
  scene.add(
    new T.LineSegments(
      lg,
      new T.LineBasicMaterial({
        color: 0xffd899,
        transparent: true,
        opacity: 0.42,
      }),
    ),
  );
  let signId = null;
  let previous = -1,
    dropIndex = -1,
    dropAt = 0;
  function settle(globalIndex) {
    const index = globalIndex % 100,
      p = stoneTransform(index);
    dummy.position.set(p.x, p.y, p.z);
    dummy.scale.set(p.sx, p.sy, p.sz);
    dummy.rotation.set((index % 3) * 0.13, p.rotation, (index % 2) * 0.08);
    dummy.updateMatrix();
    const mesh = towers[Math.floor(globalIndex / 100)];
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
  function update(camera, now, view) {
    const p = store.journey(currentClock()),
      sign = store.stars(currentClock()).sign;
    if ((sign?.id ?? null) !== signId) {
      signId = sign?.id ?? null;
      const points =
        sign?.points.map(([x, y]) => [(x - 0.5) * 24, 8 + (1 - y) * 17, -13]) ??
        [];
      sg.setAttribute(
        "position",
        new T.Float32BufferAttribute(points.flat(), 3),
      );
      lg.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          sign?.links.flatMap(([a, b]) => [...points[a], ...points[b]]) ?? [],
          3,
        ),
      );
      sg.computeBoundingSphere();
      lg.computeBoundingSphere();
    }

    if (p.stones !== previous) {
      if (dropIndex >= 0) settle(dropIndex);
      if (p.stones > previous && previous >= 0) {
        dropIndex = p.stones - 1;
        dropAt = now;
      }
      previous = p.stones;
    }
    p.slots.forEach((n, i) => {
      towers[i].count = n;
      const height = 0.34 + Math.floor(Math.max(0, n - 1) / 5) * 0.255;
      const screen = new T.Vector3(
        CENTERS[i][0],
        height + 1.2,
        CENTERS[i][1],
      ).project(camera);
      badges[i].style.display =
        view === "stars" || screen.z > 1 || Math.abs(screen.x) > 1
          ? "none"
          : "block";
      badges[i].style.left = (screen.x * 0.5 + 0.5) * innerWidth + "px";
      badges[i].style.top = (-screen.y * 0.5 + 0.5) * innerHeight + "px";
      badges[i].textContent =
        copy("journey.tower").replace("{n}", i + 1) + " · " + n + "/100";
    });
    if (dropIndex >= 0) {
      const tower = Math.floor(dropIndex / 100),
        index = dropIndex % 100,
        p = stoneTransform(index),
        t = Math.min(1, (now - dropAt) / 650);
      dummy.position.set(p.x, p.y + (1 - t) ** 3 * 2.5, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.rotation.set((index % 3) * 0.13, p.rotation, (index % 2) * 0.08);
      dummy.updateMatrix();
      towers[tower].setMatrixAt(index, dummy.matrix);
      towers[tower].instanceMatrix.needsUpdate = true;
      if (t === 1) dropIndex = -1;
    }
    return p;
  }
  return { update, towers, stars };
}
