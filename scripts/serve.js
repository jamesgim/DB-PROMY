import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".wasm": "application/wasm",
};
http
  .createServer((req, res) => {
    const target = path.resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const file =
      fs.existsSync(target) && fs.statSync(target).isDirectory()
        ? path.join(target, "world.html")
        : target;
    fs.readFile(file, (err, body) => {
      res.writeHead(err ? 404 : 200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(err ? "Not found" : body);
    });
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("http://127.0.0.1:4173/world.html"),
  );
