import * as T from "three";
export function createSky(scene, low) {
  const geometry = new T.BufferGeometry(),
    points = new Float32Array((low ? 1500 : 4000) * 3);
  for (let i = 0; i < points.length / 3; i++) {
    const a = i * 2.399963,
      r = 65 + (i % 19) * 2,
      y = 20 + (((i * 37) % 113) / 113) * 75;
    points[i * 3] = Math.cos(a) * r;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = Math.sin(a) * r;
  }
  geometry.setAttribute("position", new T.BufferAttribute(points, 3));
  const stars = new T.Points(
    geometry,
    new T.PointsMaterial({
      size: 0.24,
      color: 0xffdf9e,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
    }),
  );
  scene.add(stars);
  const hemi = new T.HemisphereLight(0xeef8ec, 0x63866b, 2.3),
    sun = new T.DirectionalLight(0xffefc9, 3.1);
  sun.position.set(-28, 57, 22);
  sun.castShadow = !low;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -30,
    right: 30,
    top: 30,
    bottom: -30,
  });
  sun.shadow.bias = -0.001;
  scene.add(hemi, sun);
  const lights = [];
  for (let i = 0; i < (low ? 4 : 8); i++) {
    const a = (i * Math.PI * 2) / 8;
    const l = new T.PointLight(0xffd493, 0, 8, 2);
    l.position.set(Math.cos(a) * 6, 2, Math.sin(a) * 6);
    scene.add(l);
    lights.push(l);
  }
  let blend = 0;
  return {
    sun,
    lights,
    update(c, s, dt, ritual) {
      const night =
          c.hour >= 18 ||
          c.hour < 6 ||
          document.body.classList.contains("viewing-sky"),
        target = night ? 1 : 0;
      blend = document.body.classList.contains("viewing-sky")
        ? 1
        : T.MathUtils.damp(blend, target, 2, dt);
      const color = new T.Color(0x88bcb4).lerp(
        new T.Color(c.hour < 6 ? 0x0d2136 : 0x102c41),
        blend,
      );
      scene.background = color;
      scene.fog.color.copy(color);
      hemi.intensity = 2.3 - blend * 1.2;
      sun.intensity = 3.1 - blend * 2.5;
      stars.material.opacity = blend * 0.85;
      geometry.setDrawRange(
        0,
        Math.min(points.length / 3, 90 + s.stars + (ritual ? 1000 : 0)),
      );
      lights.forEach(
        (l) =>
          (l.intensity = (c.hour < 6 ? 0 : blend * 1.7) + (ritual ? 1.5 : 0)),
      );
    },
    low() {
      sun.castShadow = false;
    },
  };
}
