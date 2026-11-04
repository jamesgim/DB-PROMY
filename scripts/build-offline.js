import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
async function walk(dir) {
  const result = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name).replaceAll("\\", "/");
    if (e.isDirectory()) result.push(...(await walk(p)));
    else result.push(p);
  }
  return result;
}
const core = [
  "world.html",
  "fallback.html",
  "backup.html",
  "widget.html",
  ...(await walk("src")),
  ...(await walk("assets")).filter(
    (p) =>
      !p.startsWith("assets/video/") &&
      !p.endsWith("draco_decoder.js") &&
      !p.endsWith(".txt"),
  ),
];
const hash = crypto.createHash("sha256");
for (const f of core) hash.update(await fs.readFile(f));
const version = "promy-" + hash.digest("hex").slice(0, 12);
const script = `const CACHE=${JSON.stringify(version)},CORE=${JSON.stringify(core.map((p) => "./" + p))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('promy-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET'||u.pathname.includes('/assets/video/'))return;const live=/\\.(html|js|css|json)$/.test(u.pathname);e.respondWith(caches.open(CACHE).then(async c=>{const saved=()=>c.match(e.request,{ignoreSearch:true});if(live){try{const response=await fetch(e.request);if(response.ok)await c.put(e.request,response.clone());return response;}catch(error){const cached=await saved();if(cached)return cached;throw error;}}return (await saved())??fetch(e.request);}));});
`;
await fs.writeFile("sw.js", script);
console.log("Offline core:", core.length, "files,", version);
