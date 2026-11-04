import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export async function loadAssets(progress) {
  const draco = new DRACOLoader().setDecoderPath("./assets/vendor/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const manifest = (
    await fetch("./assets/glb/manifest.json").then((r) => r.json())
  ).filter((x) => !["campfire", "seat"].includes(x.name));
  let completed = 0;
  const material = new T.MeshStandardMaterial({
    map: await new T.TextureLoader().loadAsync("./assets/atlas.png"),
    roughness: 1,
    flatShading: true,
  });
  material.map.colorSpace = T.SRGBColorSpace;
  material.map.flipY = false;
  material.map.magFilter = T.NearestFilter;
  material.map.minFilter = T.NearestFilter;
  const glow = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.promyGlow = glow;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float promyGlow;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\nfloat lampMask = step(0.25, vMapUv.x) * step(vMapUv.x, 0.5) * step(0.5, vMapUv.y) * step(vMapUv.y, 0.75);\ntotalEmissiveRadiance += lampMask * promyGlow * vec3(1.0, 0.65, 0.25);",
      );
  };
  const models = {};
  await Promise.all(
    manifest.map(async (item) => {
      const gltf = await loader.loadAsync("./assets/glb/" + item.name + ".glb");
      gltf.scene.traverse((o) => {
        if (o.isMesh) {
          o.material.dispose();
          o.material = material;
          o.receiveShadow = true;
        }
      });
      models[item.name] = gltf;
      progress(++completed / manifest.length);
    }),
  );
  draco.dispose();
  const cache = {};
  function geometry(name) {
    if (cache[name]) return cache[name];
    const model = models[name].scene;
    model.updateMatrixWorld(true);
    const parts = [];
    model.traverse((o) => {
      if (o.isMesh) {
        const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
        parts.push(geo.index ? geo.toNonIndexed() : geo);
      }
    });
    return (cache[name] = mergeGeometries(parts));
  }
  return {
    models,
    material,
    glow,
    clone(name) {
      return models[name].scene.clone(true);
    },
    scenery(batches) {
      const parts = [],
        dummy = new T.Object3D();
      for (const [name, items] of Object.entries(batches))
        for (const p of items) {
          dummy.position.set(p.x, p.y ?? 0, p.z);
          dummy.rotation.set(0, p.r ?? 0, 0);
          dummy.scale.setScalar(p.s ?? 1);
          dummy.updateMatrix();
          parts.push(geometry(name).clone().applyMatrix4(dummy.matrix));
        }
      const m = new T.Mesh(mergeGeometries(parts), material);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    },
    instances(name, positions, { color, shadow = false } = {}) {
      const mesh = new T.InstancedMesh(
        geometry(name),
        material,
        positions.length,
      );
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      const d = new T.Object3D();
      positions.forEach((p, i) => {
        d.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
        d.rotation.set(0, p.r ?? 0, 0);
        d.scale.setScalar(p.s ?? 1);
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
        if (color) mesh.setColorAt(i, new T.Color(color(i)));
      });
      mesh.instanceMatrix.needsUpdate = true;
      return mesh;
    },
    actor(name) {
      const model = models[name].scene.clone(true),
        root = new T.Group();
      root.add(model);
      const mixer = new T.AnimationMixer(model);
      const clips = Object.fromEntries(
        models[name].animations.map((c) => [c.name, mixer.clipAction(c)]),
      );
      let active;
      return {
        root,
        mixer,
        clips,
        play(name, once = false) {
          if (active === name && !once) return;
          if (active) clips[active]?.fadeOut(0.15);
          const a = clips[name];
          if (!a) return;
          a.reset().fadeIn(0.15);
          a.setLoop(once ? T.LoopOnce : T.LoopRepeat, once ? 1 : Infinity);
          a.clampWhenFinished = once;
          a.play();
          active = name;
          if (once) {
            clearTimeout(this.timer);
            this.timer = setTimeout(
              () => this.play("idle"),
              Math.max(1000, a.getClip().duration * 1000),
            );
          }
        },
      };
    },
  };
}
