import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
test("27 actual Draco GLBs stay within asset budgets and character clips target real nodes", async () => {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
    });
  const manifest = JSON.parse(await fs.readFile("assets/glb/manifest.json"));
  assert.equal(manifest.length, 27);
  for (const asset of manifest) {
    const bytes = await fs.readFile("assets/glb/" + asset.name + ".glb");
    assert.ok(bytes.length < 300000, asset.name);
    const doc = await io.readBinary(bytes);
    assert.equal(doc.getRoot().listMaterials().length, 1, asset.name);
    assert.ok(doc.getRoot().listMaterials()[0].getBaseColorTexture());
    const triangles = doc
      .getRoot()
      .listMeshes()
      .reduce(
        (n, m) =>
          n +
          m
            .listPrimitives()
            .reduce((sum, p) => sum + p.getIndices().getCount() / 3, 0),
        0,
      );
    assert.equal(triangles, asset.triangles);
    if (asset.name === "player" || asset.name === "promy") {
      assert.ok(triangles < (asset.name === "player" ? 2500 : 6000));
      const clips = doc.getRoot().listAnimations();
      for (const name of ["idle", "walk", "wave", "cheer"])
        assert.ok(clips.some((a) => a.getName() === name));
      for (const a of clips)
        for (const c of a.listChannels()) {
          assert.ok(c.getTargetNode());
          assert.ok(c.getSampler().getInput().getCount() >= 3);
        }
    }
  }
});
