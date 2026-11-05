import fs from "node:fs/promises";
import path from "node:path";
const source = "node_modules/three/examples/jsm",
  target = "assets/vendor/addons";
const queue = [
    "loaders/GLTFLoader.js",
    "loaders/DRACOLoader.js",
    "utils/BufferGeometryUtils.js",
    "postprocessing/EffectComposer.js",
    "postprocessing/RenderPass.js",
    "postprocessing/UnrealBloomPass.js",
    "postprocessing/OutputPass.js",
  ],
  seen = new Set();
while (queue.length) {
  const file = path.normalize(queue.pop()).replaceAll("\\", "/");
  if (seen.has(file)) continue;
  seen.add(file);
  const content = await fs.readFile(path.join(source, file), "utf8"),
    out = path.join(target, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, content);
  for (const m of content.matchAll(/from\s+['"]([^'"]+)['"]/g))
    if (m[1].startsWith(".")) queue.push(path.join(path.dirname(file), m[1]));
}
async function files(dir) {
  const all = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) all.push(...(await files(p)));
    else all.push(p);
  }
  return all;
}
for (const file of await files(target))
  if (!seen.has(path.relative(target, file).replaceAll("\\", "/")))
    await fs.unlink(file);
await fs.copyFile(
  "node_modules/three/build/three.module.js",
  "assets/vendor/three.module.js",
);
await fs.copyFile(
  "node_modules/three/LICENSE",
  "assets/vendor/THREE-LICENSE.txt",
);
await fs.mkdir("assets/vendor/draco", { recursive: true });
for (const name of [
  "draco_decoder.wasm",
  "draco_wasm_wrapper.js",
  "draco_decoder.js",
])
  await fs.copyFile(
    path.join(source, "libs/draco/gltf", name),
    path.join("assets/vendor/draco", name),
  );
console.log("Vendored", seen.size, "Three.js addon modules");
