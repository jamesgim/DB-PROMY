import fs from "node:fs/promises";
import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { dedup, prune, weld, draco } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { deflateSync } from "node:zlib";
// Independently authored geometric models. Source images are never embedded.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((v) => {
      this.result = v;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((v) => {
      this.result =
        "data:application/octet-stream;base64," +
        Buffer.from(v).toString("base64");
      this.onloadend?.();
    });
  }
};
const colors = [
  "#F5F0DF",
  "#17543C",
  "#275D49",
  "#7CA88B",
  "#88A982",
  "#C9BFA8",
  "#B95146",
  "#785746",
  "#FFDA91",
  "#FFE3A0",
  "#102C41",
  "#00703C",
  "#FFCE22",
  "#F77734",
  "#302D23",
  "#F4A18B",
];
const pixels = Buffer.alloc(256 * 256 * 4);
for (let y = 0; y < 256; y++)
  for (let x = 0; x < 256; x++) {
    const i = Math.floor(y / 64) * 4 + Math.floor(x / 64),
      hex = colors[i].slice(1),
      p = (y * 256 + x) * 4;
    for (let k = 0; k < 3; k++)
      pixels[p + k] = parseInt(hex.slice(k * 2, k * 2 + 2), 16);
    pixels[p + 3] = 255;
  }
function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) {
    c ^= x;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const t = Buffer.from(type),
    n = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  n.writeUInt32BE(bytes.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t, bytes])));
  return Buffer.concat([n, t, bytes, crc]);
}
function png() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(256);
  header.writeUInt32BE(256, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc(256 * (1024 + 1));
  for (let y = 0; y < 256; y++)
    pixels.copy(rows, y * 1025 + 1, y * 1024, (y + 1) * 1024);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
await fs.mkdir("assets/glb", { recursive: true });
const atlas = png();
await fs.writeFile("assets/atlas.png", atlas);
const material = new T.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1,
  flatShading: true,
});
function group(name, parent, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent?.add(g);
  g.userData.pieces = [];
  return g;
}
function add(
  g,
  geo,
  color,
  x = 0,
  y = 0,
  z = 0,
  sx = 1,
  sy = 1,
  sz = 1,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  geo.rotateX(rx);
  geo.rotateY(ry);
  geo.rotateZ(rz);
  geo.scale(sx, sy, sz);
  geo.translate(x, y, z);
  geo.computeVertexNormals();
  const uv = new Float32Array(geo.attributes.position.count * 2);
  for (let i = 0; i < uv.length; i += 2) {
    uv[i] = ((color % 4) + 0.5) / 4;
    uv[i + 1] = (Math.floor(color / 4) + 0.5) / 4;
  }
  geo.setAttribute("uv", new T.BufferAttribute(uv, 2));
  g.userData.pieces.push(geo);
}
const box = (g, w, h, d, c, x = 0, y = 0, z = 0, ry = 0) =>
  add(g, new T.BoxGeometry(w, h, d), c, x, y, z, 1, 1, 1, 0, ry);
const ball = (g, r, c, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) =>
  add(g, new T.SphereGeometry(r, 10, 6), c, x, y, z, sx, sy, sz);
const cyl = (g, rt, rb, h, c, x = 0, y = 0, z = 0, n = 8, ry = 0) =>
  add(g, new T.CylinderGeometry(rt, rb, h, n), c, x, y, z, 1, 1, 1, 0, ry);
function tube(g, points, r, c) {
  add(
    g,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      12,
      r,
      5,
      false,
    ),
    c,
  );
}
function finish(g) {
  g.traverse((o) => {
    if (o.userData.pieces?.length) {
      const mesh = new T.Mesh(mergeGeometries(o.userData.pieces), material);
      mesh.name = o.name + "Mesh";
      o.add(mesh);
      o.userData = {};
    }
  });
  return g;
}
function animation(name, duration, tracks) {
  return new T.AnimationClip(name, duration, tracks);
}
const rotation = (part, axis, values, time = [0, 0.25, 0.5, 0.75, 1]) => {
  const q = values.flatMap((v) =>
    new T.Quaternion().setFromAxisAngle(new T.Vector3(...axis), v).toArray(),
  );
  return new T.QuaternionKeyframeTrack(part + ".quaternion", time, q);
};
const position = (part, values, time = [0, 0.5, 1]) =>
  new T.VectorKeyframeTrack(part + ".position", time, values.flat());
function character(pc) {
  const root = group(pc ? "Player" : "Promy"),
    body = group("Body", root),
    head = group("Head", root, 0, pc ? 2.7 : 2.65, 0),
    left = group("ArmL", root, -(pc ? 0.67 : 1), 1.7, 0),
    right = group("ArmR", root, pc ? 0.67 : 1, 1.7, 0),
    legL = group("LegL", root, -0.36, 0.25, 0),
    legR = group("LegR", root, 0.36, 0.25, 0);
  if (pc) {
    ball(body, 0.78, 0, 0, 1.2, 0, 0.9, 1, 0.8);
    cyl(body, 0.69, 0.71, 0.38, 13, 0, 1.25, 0, 12);
    ball(head, 1.05, 0, 0, 0, 0, 1, 1, 0.9);
    tube(
      head,
      [
        [-0.12, 0.98, 0],
        [-0.35, 1.22, 0],
        [-0.31, 1.5, 0],
        [0.23, 1.73, 0],
        [0.4, 2.02, 0],
        [0.27, 2.21, 0],
      ],
      0.24,
      13,
    );
    for (const x of [-0.37, 0.37])
      ball(head, 0.085, 14, x, 0.02, 0.91, 1, 1, 0.5);
    tube(
      head,
      [
        [-0.22, -0.28, 0.98],
        [0, -0.4, 1.01],
        [0.23, -0.25, 0.98],
      ],
      0.038,
      14,
    );
    ball(left, 0.26, 0, -0.1, -0.35, 0, 0.9, 1.4, 0.9);
    ball(right, 0.26, 0, 0.1, -0.35, 0, 0.9, 1.4, 0.9);
    ball(legL, 0.32, 0, 0, 0, 0.07, 1, 0.7, 1);
    ball(legR, 0.32, 0, 0, 0, 0.07, 1, 0.7, 1);
  } else {
    ball(body, 0.98, 12, 0, 1.28, 0, 1, 0.88, 0.7);
    // One extruded asymmetrical scalloped silhouette, including the rising right corner.
    const shape = new T.Shape();
    shape.moveTo(-1.1, -0.55);
    shape.bezierCurveTo(-1.3, -0.15, -1.2, 0.6, -0.86, 0.83);
    shape.quadraticCurveTo(-0.57, 1.03, -0.35, 0.79);
    shape.quadraticCurveTo(-0.06, 1.11, 0.2, 0.85);
    shape.quadraticCurveTo(0.48, 1.02, 0.7, 0.82);
    shape.bezierCurveTo(0.75, 1.55, 1.05, 1.48, 1.16, 1);
    shape.bezierCurveTo(1.29, 0.55, 1.28, -0.3, 1.08, -0.58);
    shape.quadraticCurveTo(0, -0.83, -1.1, -0.55);
    add(
      head,
      new T.ExtrudeGeometry(shape, {
        depth: 0.95,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.12,
        bevelThickness: 0.15,
        curveSegments: 4,
      }),
      12,
      0,
      0,
      -0.48,
    );
    for (const x of [-0.43, 0.43]) {
      ball(head, 0.085, 14, x, 0.03, 0.65, 0.9, 1.35, 0.45);
      ball(head, 0.17, 15, x * 1.4, -0.2, 0.63, 1, 0.55, 0.14);
    }
    tube(
      head,
      [
        [-0.18, -0.22, 0.68],
        [-0.1, -0.29, 0.7],
        [0, -0.22, 0.71],
        [0.1, -0.29, 0.7],
        [0.2, -0.2, 0.68],
      ],
      0.033,
      14,
    );
    cyl(body, 0.96, 1.27, 1.1, 11, 0, 1.13, -0.23, 10);
    ball(body, 0.98, 12, 0, 1.23, 0.07, 1, 0.8, 0.7);
    cyl(body, 1.08, 1.08, 0.14, 11, 0, 1.97, 0, 12);
    cyl(body, 1.07, 1.07, 0.12, 1, 0, 1.82, 0, 12);
    ball(body, 0.17, 11, 0.75, 1.88, 0.62);
    ball(body, 0.2, 11, 0.68, 1.65, 0.69, 0.65, 1.6, 0.4);
    ball(body, 0.2, 11, 0.91, 1.63, 0.56, 0.65, 1.5, 0.5);
    // Raised speech-bubble emblem with a separately authored P stroke.
    box(body, 0.44, 0.45, 0.08, 11, 0, 1.25, 0.76);
    add(
      body,
      new T.ConeGeometry(0.12, 0.22, 3),
      11,
      -0.14,
      0.96,
      0.76,
      1,
      1,
      0.2,
      0,
      0,
      Math.PI,
    );
    box(body, 0.065, 0.29, 0.025, 12, -0.08, 1.25, 0.815);
    tube(
      body,
      [
        [-0.08, 1.39, 0.82],
        [0.08, 1.39, 0.82],
        [0.13, 1.29, 0.82],
        [-0.07, 1.25, 0.82],
      ],
      0.035,
      12,
    );
    ball(left, 0.26, 12, -0.08, -0.25, 0, 0.85, 1.4, 0.85);
    ball(right, 0.26, 12, 0.08, -0.25, 0, 0.85, 1.4, 0.85);
    ball(legL, 0.34, 11, 0, 0, 0.02, 1, 0.68, 0.95);
    ball(legR, 0.34, 11, 0, 0, 0.02, 1, 0.68, 0.95);
    const hat = group("PostmasterHat", root, 0, 3.85, 0);
    cyl(hat, 0.46, 0.5, 0.16, 1, 0, 0.07, 0, 10);
    box(hat, 1.25, 0.09, 0.68, 11, 0, 0, 0.13);
    hat.userData.accessory = true;
    const bag = group("PostmasterBag", root, -0.85, 1.2, 0.3);
    box(bag, 0.5, 0.65, 0.3, 7);
    tube(
      bag,
      [
        [0, 0.3, 0],
        [0.2, 1.3, -0.3],
        [0.55, 1.5, -0.5],
      ],
      0.05,
      7,
    );
    bag.userData.accessory = true;
  }
  const idle = animation("idle", 2, [
    position(
      "Body",
      [
        [0, 0, 0],
        [0, 0.06, 0],
        [0, 0, 0],
      ],
      [0, 1, 2],
    ),
  ]);
  const walk = animation("walk", 1, [
    rotation("ArmL", [1, 0, 0], [0, 0.45, 0, -0.45, 0]),
    rotation("ArmR", [1, 0, 0], [0, -0.45, 0, 0.45, 0]),
    rotation("LegL", [1, 0, 0], [0, -0.4, 0, 0.4, 0]),
    rotation("LegR", [1, 0, 0], [0, 0.4, 0, -0.4, 0]),
  ]);
  const wave = animation("wave", 1, [
    rotation("ArmR", [0, 0, 1], [0, 2.2, 1.65, 2.2, 0]),
  ]);
  const cheer = animation("cheer", 1, [
    rotation("ArmL", [0, 0, 1], [0, -2, -1.6, -2, 0]),
    rotation("ArmR", [0, 0, 1], [0, 2, 1.6, 2, 0]),
    position(root.name, [
      [0, 0, 0],
      [0, 0.3, 0],
      [0, 0, 0],
    ]),
  ]);
  const clips = [idle, walk, wave, cheer];
  if (pc) {
    clips.push(
      animation("sit", 1, [
        rotation("LegL", [1, 0, 0], [0, -0.8, -1.4, -1.4, 0]),
        rotation("LegR", [1, 0, 0], [0, -0.8, -1.4, -1.4, 0]),
      ]),
    );
    clips.push(
      animation("fold_paper", 1, [
        rotation("ArmL", [1, 0, 0], [0, -1, -0.8, -1, 0]),
        rotation("ArmR", [1, 0, 0], [0, -1, -0.8, -1, 0]),
      ]),
    );
    clips.push(
      animation("check_in", 1, [
        rotation("ArmR", [0, 0, 1], [0, 1.3, 1.1, 1.3, 0]),
        rotation("Head", [1, 0, 0], [0, 0.12, 0, -0.05, 0]),
      ]),
    );
  } else {
    clips.push(
      animation("lantern_add", 1, [
        rotation("ArmL", [1, 0, 0], [0, -0.5, -1.3, -1, 0]),
        rotation("ArmR", [1, 0, 0], [0, -0.5, -1.3, -1, 0]),
      ]),
    );
    clips.push(
      animation("point", 1, [
        rotation("ArmR", [0, 0, 1], [0, 1.4, 1.4, 1.4, 0]),
      ]),
    );
  }
  return { root: finish(root), clips };
}
function prop(name, fn, clips = []) {
  const root = group(name);
  fn(root);
  return { root: finish(root), clips };
}
const assets = { player: character(true), promy: character(false) };
assets.mailbox = prop(
  "Mailbox",
  (g) => {
    cyl(g, 1, 1.1, 0.22, 6, 0, 0.11);
    box(g, 1.7, 2.6, 1.3, 6, 0, 1.5);
    box(g, 1.1, 0.15, 0.1, 10, 0, 2.1, 0.71);
    box(g, 1.1, 0.4, 0.1, 0, 0, 1.2, 0.71);
    const lid = group("Lid", g, 0, 2.8, 0);
    cyl(lid, 0.9, 0.9, 0.3, 6, 0, 0, 0, 12);
  },
  [
    animation("lid_open", 1, [
      rotation("Lid", [1, 0, 0], [0, -0.6, -0.6, -0.3, 0]),
    ]),
    animation("glow", 1, [
      position("Mailbox", [
        [0, 0, 0],
        [0, 0.05, 0],
        [0, 0, 0],
      ]),
    ]),
  ],
);
for (let variant = 0; variant < 3; variant++)
  assets["house-" + variant] = prop("House", (g) => {
    box(g, 6, 3.7, 5, variant === 1 ? 3 : 0, 0, 1.9);
    add(
      g,
      new T.ConeGeometry(4.6, 2.7, 4),
      2,
      0,
      5.05,
      0,
      1,
      1,
      0.85,
      0,
      Math.PI / 4,
    );
    box(g, 1.15, 2.5, 0.14, 7, 0, 1.3, 2.6);
    box(g, 1.15, 0.15, 0.7, 5, 0, 0.15, 2.95);
    box(g, 0.5, 1.8, 0.5, 7, -1.8, 5.5, -1);
    const windows = group("Windows", g);
    for (const x of [-1.85, 1.85]) box(windows, 1.1, 1.35, 0.1, 9, x, 2, 2.58);
    const table = group("MealLight", g);
    box(table, 0.8, 0.4, 0.1, 9, -1.85, 1.5, 2.65);
    const door = group("DoorLight", g);
    box(door, 0.3, 0.35, 0.15, 9, 0.85, 2.85, 2.65);
  });
assets.postoffice = prop("Postoffice", (g) => {
  box(g, 10, 5, 7, 0, 0, 2.5);
  add(
    g,
    new T.ConeGeometry(7.4, 3, 4),
    2,
    0,
    6.5,
    0,
    1,
    1,
    0.8,
    0,
    Math.PI / 4,
  );
  box(g, 2.1, 3.4, 0.15, 7, 0, 1.7, 3.58);
  for (const x of [-3.3, 3.3]) box(g, 1.6, 2, 0.12, 9, x, 2.6, 3.6);
  for (const x of [-5, 5]) box(g, 0.35, 3.3, 0.35, 7, x, 1.65, 4.4);
  box(g, 11, 0.3, 2, 2, 0, 3.5, 4.2);
});
assets.lantern = prop("Lantern", (g) => {
  cyl(g, 0.07, 0.09, 1.5, 1, 0, 0.75);
  box(g, 0.42, 0.06, 0.42, 2, 0, 1.5);
  box(g, 0.3, 0.38, 0.3, 9, 0, 1.72);
  box(g, 0.42, 0.08, 0.42, 2, 0, 1.95);
});
assets["lantern-hanging"] = prop("Hanging", (g) => {
  box(g, 0.34, 0.5, 0.34, 9, 0, 0.6);
  box(g, 0.5, 0.08, 0.5, 2, 0, 0.91);
  cyl(g, 0.025, 0.025, 0.5, 7, 0, 1.2);
});
assets["lantern-floor"] = prop("Floor", (g) => {
  box(g, 0.4, 0.4, 0.4, 9, 0, 0.3);
  box(g, 0.5, 0.1, 0.5, 2, 0, 0.55);
});
assets.seat = prop("LogSeat", (g) => cyl(g, 0.45, 0.5, 0.65, 7, 0, 0.34));
assets.campfire = prop(
  "Campfire",
  (g) => {
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      ball(g, 0.28, 5, Math.cos(a), 0.2, Math.sin(a));
    }
    box(g, 1.6, 0.25, 0.3, 7, 0, 0.3, 0, 0.5);
    box(g, 1.5, 0.25, 0.3, 7, 0, 0.5, 0, -0.5);
    const flame = group("Flame", g);
    add(flame, new T.ConeGeometry(0.5, 1.2, 6), 8, 0, 1, 0);
  },
  [
    animation("flame", 1, [
      position("Flame", [
        [0, 0, 0],
        [0, 0.2, 0],
        [0, 0, 0],
      ]),
    ]),
  ],
);
for (let i = 0; i < 3; i++)
  assets["tree-" + i] = prop("Tree", (g) => {
    cyl(g, 0.12, 0.24, 2.8, 7, 0, 1.4);
    if (i === 0) {
      for (let j = 0; j < 3; j++)
        add(
          g,
          new T.ConeGeometry(1.7 - j * 0.35, 2.4, 6),
          1,
          0,
          2.6 + j * 0.9,
          0,
        );
    } else {
      add(
        g,
        new T.IcosahedronGeometry(1.8, 0),
        i === 1 ? 4 : 3,
        0,
        3.7,
        0,
        1,
        1.25,
        1,
      );
      add(g, new T.IcosahedronGeometry(1.2, 0), 4, -0.7, 2.8, 0);
    }
  });
for (let i = 0; i < 2; i++)
  assets["bush-" + i] = prop("Bush", (g) => {
    add(g, new T.IcosahedronGeometry(0.6, 0), i ? 3 : 4, 0, 0.5, 0, 1.4, 1, 1);
  });
assets.flower = prop("Flower", (g) => {
  cyl(g, 0.025, 0.025, 0.35, 1, 0, 0.18, 0, 4);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    add(
      g,
      new T.IcosahedronGeometry(0.1, 0),
      15,
      Math.cos(a) * 0.1,
      0.42,
      Math.sin(a) * 0.1,
    );
  }
  add(g, new T.IcosahedronGeometry(0.07, 0), 8, 0, 0.43, 0);
});
assets.bench = prop("Bench", (g) => {
  box(g, 2, 0.16, 0.65, 7, 0, 0.65);
  box(g, 2, 0.65, 0.12, 7, 0, 1.05, -0.3);
  for (const x of [-0.7, 0.7]) box(g, 0.12, 0.7, 0.5, 1, x, 0.35);
});
assets.fence = prop("Fence", (g) => {
  for (const x of [-1, 0, 1]) box(g, 0.1, 1, 0.1, 0, x, 0.5);
  for (const y of [0.3, 0.8]) box(g, 2.3, 0.12, 0.1, 0, 0, y);
});
assets.arch = prop("Arch", (g) => {
  for (const x of [-3, 3]) box(g, 0.4, 5, 0.4, 7, x, 2.5);
  box(g, 6.5, 0.5, 0.5, 7, 0, 5);
});
assets.bunting = prop("Bunting", (g) => {
  box(g, 7, 0.035, 0.035, 7, 0, 3);
  for (let i = 0; i < 8; i++)
    add(
      g,
      new T.ConeGeometry(0.2, 0.45, 3),
      i % 2 ? 8 : 3,
      -3 + i * 0.85,
      2.76,
      0,
      1,
      1,
      0.05,
      0,
      0,
      Math.PI,
    );
});
assets.crosswalk = prop("Crosswalk", (g) => {
  box(g, 15, 0.12, 8, 5, 0, 0.06);
  box(g, 15, 0.1, 4.2, 10, 0, 0.15);
  for (let i = -5; i <= 5; i++) box(g, 0.7, 0.025, 4, 0, i * 1.2, 0.22);
  for (const x of [-6, 6]) {
    cyl(g, 0.07, 0.08, 3.2, 1, x, 1.6, -2.8);
    box(g, 0.5, 1, 0.4, 10, x, 3, -2.8);
    ball(g, 0.12, 6, x, 3.2, -2.55);
    ball(g, 0.12, 3, x, 2.8, -2.55);
  }
});
assets.fountain = prop("Fountain", (g) => {
  cyl(g, 1.9, 2.1, 0.4, 5, 0, 0.2, 0, 12);
  cyl(g, 1.65, 1.65, 0.1, 3, 0, 0.45, 0, 12);
  cyl(g, 0.16, 0.25, 1.1, 5, 0, 0.8);
  cyl(g, 0.7, 0.8, 0.15, 3, 0, 1.35, 0, 10);
});
assets.dog = prop(
  "Dog",
  (g) => {
    box(g, 0.8, 0.5, 0.4, 0, 0, 0.6);
    ball(g, 0.28, 7, 0.45, 0.8, 0);
    for (const x of [-0.3, 0.3])
      for (const z of [-0.16, 0.16]) box(g, 0.12, 0.35, 0.12, 7, x, 0.25, z);
    tube(
      g,
      [
        [-0.4, 0.7, 0],
        [-0.65, 0.85, 0],
        [-0.6, 1, 0],
      ],
      0.07,
      0,
    );
  },
  [
    animation("dog_walk", 1, [
      position("Dog", [
        [0, 0, 0],
        [0, 0.07, 0],
        [0, 0, 0],
      ]),
    ]),
  ],
);
assets.sports = prop("Sports", (g) => {
  box(g, 15, 0.15, 10, 3, 0, 0.1);
  for (const x of [-5.7, 5.7]) {
    for (const z of [-1.7, 1.7]) box(g, 0.1, 2, 0.1, 0, x, 1, z);
    box(g, 0.1, 0.1, 3.5, 0, x, 2);
  }
  for (const z of [-3.5, 3.5]) box(g, 13, 0.03, 0.07, 0, 0, 0.2, z);
});
assets.dinner = prop("Dinner", (g) => {
  cyl(g, 1.1, 1.1, 0.15, 7, 0, 1);
  cyl(g, 0.1, 0.15, 1, 7, 0, 0.5);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    box(g, 0.7, 0.15, 0.65, 7, Math.cos(a) * 1.7, 0.6, Math.sin(a) * 1.7);
    for (const dx of [-0.2, 0.2])
      box(g, 0.08, 0.6, 0.5, 7, Math.cos(a) * 1.7 + dx, 0.3, Math.sin(a) * 1.7);
  }
});
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });
const report = [];
for (const [name, { root, clips }] of Object.entries(assets)) {
  const bytes = await new GLTFExporter().parseAsync(root, {
    binary: true,
    animations: clips,
    onlyVisible: false,
  });
  const doc = await io.readBinary(new Uint8Array(bytes));
  const texture = doc
    .createTexture("PROMY shared palette")
    .setImage(atlas)
    .setMimeType("image/png");
  for (const m of doc.getRoot().listMaterials())
    m.setBaseColorTexture(texture)
      .setBaseColorFactor([1, 1, 1, 1])
      .setMetallicFactor(0)
      .setRoughnessFactor(1);
  await doc.transform(
    dedup(),
    prune(),
    weld(),
    draco({ method: "edgebreaker", encodeSpeed: 5, decodeSpeed: 5 }),
  );
  const out = await io.writeBinary(doc);
  await fs.writeFile("assets/glb/" + name + ".glb", out);
  const decoded = await io.readBinary(out);
  const triangles = decoded
    .getRoot()
    .listMeshes()
    .reduce(
      (n, m) =>
        n +
        m
          .listPrimitives()
          .reduce(
            (v, p) =>
              v +
              (p.getIndices()?.getCount() ??
                p.getAttribute("POSITION").getCount()) /
                3,
            0,
          ),
      0,
    );
  report.push({
    name,
    bytes: out.length,
    triangles,
    clips: clips.map((c) => c.name),
  });
}
await fs.writeFile("assets/glb/manifest.json", JSON.stringify(report, null, 2));
console.table(
  report.map(({ name, bytes, triangles }) => ({ name, bytes, triangles })),
);
