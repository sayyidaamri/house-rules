/* House Rules — hand-built 3D game pieces (three.js r149, classic script).
   Toon shading + inverted-hull outlines give an illustrated, engraved look. */
(function () {
  const T = window.THREE; if (!T) return;
  const C = { cream: 0xf6ddb0, ivory: 0xfff4dc, gold: 0xf7b538, ochre: 0xc98f2e, blue: 0x0b3a69, navy: 0x08335d, ink: 0x5a3510, azure: 0xfdffff, teal: 0x145a86 };

  let grad = null;
  function gradient() {
    if (grad) return grad;
    const d = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
    grad = new T.DataTexture(d, 3, 1, T.RGBAFormat); grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true; return grad;
  }
  const toon = (color, extra = {}) => new T.MeshToonMaterial({ color, gradientMap: gradient(), ...extra });
  const outlineMat = (color = C.ink) => new T.MeshBasicMaterial({ color, side: T.BackSide });
  function withOutline(mesh, w = 0.045, color) {
    const o = new T.Mesh(mesh.geometry, outlineMat(color));
    o.scale.setScalar(1 + w); o.userData.outline = true; mesh.add(o); return mesh;
  }
  const lathe = (pts, seg = 48) => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), seg);

  // profiles are [radius, height] from the base upward
  const base = [[0, 0], [0.62, 0], [0.64, 0.05], [0.62, 0.12], [0.56, 0.16], [0.58, 0.2], [0.5, 0.26], [0.42, 0.3]];
  function pawn() {
    const g = new T.Group();
    const body = withOutline(new T.Mesh(lathe([...base, [0.32, 0.42], [0.24, 0.7], [0.2, 0.86], [0.34, 0.9], [0.36, 0.95], [0.2, 1.0], [0.0, 1.0]]), toon(C.cream)));
    const head = withOutline(new T.Mesh(new T.SphereGeometry(0.3, 40, 24), toon(C.cream)), 0.05);
    head.position.y = 1.22; g.add(body, head);
    const ring = withOutline(new T.Mesh(new T.TorusGeometry(0.47, 0.035, 10, 48), toon(C.gold)), 0.08); ring.rotation.x = Math.PI / 2; ring.position.y = 0.27; g.add(ring);
    return norm(g);
  }
  function rook() {
    const g = new T.Group();
    g.add(withOutline(new T.Mesh(lathe([...base, [0.36, 0.42], [0.3, 0.95], [0.42, 1.05], [0.44, 1.38], [0, 1.38]]), toon(C.cream))));
    for (let i = 0; i < 5; i++) { const b = withOutline(new T.Mesh(new T.BoxGeometry(0.18, 0.2, 0.16), toon(C.cream)), 0.06); const a = (i / 5) * Math.PI * 2; b.position.set(Math.cos(a) * 0.36, 1.46, Math.sin(a) * 0.36); b.rotation.y = -a; g.add(b); }
    const ring = withOutline(new T.Mesh(new T.TorusGeometry(0.46, 0.03, 10, 48), toon(C.gold)), 0.08); ring.rotation.x = Math.PI / 2; ring.position.y = 0.27; g.add(ring);
    return norm(g);
  }
  function king(color = C.cream, trim = C.gold) {
    const g = new T.Group();
    g.add(withOutline(new T.Mesh(lathe([...base, [0.34, 0.42], [0.22, 1.2], [0.36, 1.26], [0.38, 1.32], [0.24, 1.38], [0.32, 1.62], [0.34, 1.7], [0, 1.72]]), toon(color))));
    const cv = withOutline(new T.Mesh(new T.BoxGeometry(0.12, 0.42, 0.12), toon(trim)), 0.08); cv.position.y = 1.92; g.add(cv);
    const ch = withOutline(new T.Mesh(new T.BoxGeometry(0.34, 0.12, 0.12), toon(trim)), 0.08); ch.position.y = 1.98; g.add(ch);
    [0.27, 1.3].forEach((y) => { const r = withOutline(new T.Mesh(new T.TorusGeometry(y < 1 ? 0.46 : 0.36, 0.035, 10, 48), toon(trim)), 0.08); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
    return norm(g);
  }
  function roundedBox(w, h, d, r, seg = 5) {
    const geo = new T.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2); const p = geo.attributes.position; const v = new T.Vector3();
    const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = new T.Vector3(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z))); const n = v.clone().sub(c); if (n.lengthSq() > 0) n.normalize().multiplyScalar(r); v.copy(c.add(n)); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); return geo;
  }
  // die with diamond pips; faces follow standard layout (+y = 1, -y = 6, +x = 2, -x = 5, +z = 3, -z = 4)
  function die(body = C.ivory, pip = C.gold) {
    const g = new T.Group();
    g.add(withOutline(new T.Mesh(roundedBox(1, 1, 1, 0.16), toon(body)), 0.03));
    const pm = toon(pip); const pg = new T.CircleGeometry(0.085, 4);
    const L = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    const faces = [[1, [0, 1, 0]], [6, [0, -1, 0]], [2, [1, 0, 0]], [5, [-1, 0, 0]], [3, [0, 0, 1]], [4, [0, 0, -1]]];
    faces.forEach(([n, nrm]) => {
      const N = new T.Vector3(...nrm); const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), N);
      L[n].forEach(([a, b]) => { const m = new T.Mesh(pg, pm); m.position.set(a * 0.25, b * 0.25, 0.501).applyQuaternion(q); m.quaternion.copy(q); m.rotateZ(Math.PI / 4); if (n === 1) m.scale.setScalar(1.6); g.add(m); });
    });
    g.userData.faceNormals = faces.map(([n, nrm]) => ({ n, v: new T.Vector3(...nrm) }));
    return g;
  }
  function cardTexture(face) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 356; const x = c.getContext("2d");
    if (face === "back") {
      x.fillStyle = "#08335d"; x.fillRect(0, 0, 256, 356); x.strokeStyle = "#f7b538"; x.lineWidth = 6; x.strokeRect(14, 14, 228, 328); x.lineWidth = 2; x.strokeRect(26, 26, 204, 304);
      x.save(); x.beginPath(); x.rect(30, 30, 196, 296); x.clip(); x.strokeStyle = "rgba(247,181,56,.45)"; x.lineWidth = 1.2; for (let i = -400; i < 400; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 356, 356); x.stroke(); x.beginPath(); x.moveTo(i + 356, 0); x.lineTo(i, 356); x.stroke(); } x.restore();
      x.fillStyle = "#f7b538"; x.translate(128, 178); x.rotate(Math.PI / 4); x.fillRect(-26, -26, 52, 52);
    } else {
      x.fillStyle = "#fdf3df"; x.fillRect(0, 0, 256, 356); x.strokeStyle = "#c98f2e"; x.lineWidth = 3; x.strokeRect(12, 12, 232, 332);
      x.fillStyle = "#f7b538"; x.save(); x.translate(128, 178); x.rotate(Math.PI / 4); x.fillRect(-22, -22, 44, 44); x.restore();
      x.fillStyle = "#08335d"; x.font = "bold 34px Georgia"; x.fillText("7", 24, 52); x.save(); x.translate(232, 304); x.rotate(Math.PI); x.fillText("7", 0, 0); x.restore();
    }
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function card(front = "face", back = "back") {
    const g = new T.Group(); const geo = roundedBox(0.72, 1, 0.025, 0.012, 2);
    const edge = toon(C.cream);
    const m = new T.Mesh(geo, edge); withOutline(m, 0.02); g.add(m);
    const pf = new T.Mesh(new T.PlaneGeometry(0.7, 0.97), new T.MeshBasicMaterial({ map: cardTexture(front) })); pf.position.z = 0.014; g.add(pf);
    const pb = new T.Mesh(new T.PlaneGeometry(0.7, 0.97), new T.MeshBasicMaterial({ map: cardTexture(back) })); pb.position.z = -0.014; pb.rotation.y = Math.PI; g.add(pb);
    return g;
  }
  function coin(color = C.gold, rim = C.ochre) {
    const g = new T.Group();
    const m = withOutline(new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.1, 48), [toon(rim), toon(color), toon(color)]), 0.04); g.add(m);
    const dm = new T.Mesh(new T.CircleGeometry(0.16, 4), toon(rim)); dm.rotation.x = -Math.PI / 2; dm.rotation.z = Math.PI / 4; dm.position.y = 0.051; g.add(dm);
    return g;
  }
  function chipStack(n = 5, a = C.navy, b = C.gold) {
    const g = new T.Group();
    for (let i = 0; i < n; i++) { const c = coin(a, b); c.scale.set(1, 1.6, 1); c.position.set((Math.random() - 0.5) * 0.04, i * 0.17, (Math.random() - 0.5) * 0.04); g.add(c); }
    return g;
  }
  function book() {
    const g = new T.Group(); const blue = toon(C.navy), page = toon(0xfff6e4), gold = toon(C.gold);
    const coverL = withOutline(new T.Mesh(new T.BoxGeometry(1, 1.35, 0.04), blue), 0.03); coverL.position.set(-0.52, 0, 0); coverL.rotation.y = 0.35;
    const coverR = withOutline(new T.Mesh(new T.BoxGeometry(1, 1.35, 0.04), blue), 0.03); coverR.position.set(0.52, 0, 0); coverR.rotation.y = -0.35;
    const pagesL = new T.Mesh(new T.BoxGeometry(0.94, 1.28, 0.12), page); pagesL.position.set(-0.5, 0, 0.08); pagesL.rotation.y = 0.35;
    const pagesR = new T.Mesh(new T.BoxGeometry(0.94, 1.28, 0.12), page); pagesR.position.set(0.5, 0, 0.08); pagesR.rotation.y = -0.35;
    const spine = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.35, 12), gold);
    const lines = new T.Group(); for (let i = 0; i < 9; i++) { const l = new T.Mesh(new T.PlaneGeometry(0.62, 0.025), new T.MeshBasicMaterial({ color: 0x5a7da3 })); l.position.set(0, 0.4 - i * 0.09, 0.141); lines.add(l); } lines.position.copy(pagesR.position); lines.rotation.copy(pagesR.rotation);
    const lines2 = lines.clone(); lines2.position.copy(pagesL.position); lines2.rotation.copy(pagesL.rotation);
    g.add(coverL, coverR, pagesL, pagesR, spine, lines, lines2); return g;
  }
  function ring(r = 1.6, color = C.gold) {
    const g = new T.Group();
    const t1 = new T.Mesh(new T.TorusGeometry(r, 0.018, 8, 160), new T.MeshBasicMaterial({ color })); t1.rotation.x = Math.PI / 2;
    const t2 = new T.Mesh(new T.TorusGeometry(r * 0.94, 0.008, 8, 160), new T.MeshBasicMaterial({ color })); t2.rotation.x = Math.PI / 2;
    g.add(t1, t2);
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => { const d = new T.Mesh(new T.OctahedronGeometry(0.06), new T.MeshBasicMaterial({ color })); d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); d.scale.y = 0.4; g.add(d); });
    return g;
  }
  function shadow(r = 0.9, o = 0.25) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(1,14,28,${o})`); gr.addColorStop(1, "rgba(1,14,28,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m;
  }
  // scale a group so its height is 1 and its base sits at y = 0
  function norm(g) { const b = new T.Box3().setFromObject(g); const s = 1 / (b.max.y - b.min.y); const w = new T.Group(); g.scale.setScalar(s); g.position.y = -b.min.y * s; w.add(g); return w; }

  function renderer(canvas, { alpha = true } = {}) {
    const r = new T.WebGLRenderer({ canvas, alpha, antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); return r;
  }
  function lights(scene) {
    scene.add(new T.AmbientLight(0xffffff, 0.45));
    const d = new T.DirectionalLight(0xffffff, 0.75); d.position.set(-3, 6, 5); scene.add(d);
    return d;
  }
  function fit(r, cam, el) { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }

  window.HRP = { C, toon, withOutline, pawn, rook, king, die, card, coin, chipStack, book, ring, shadow, roundedBox, renderer, lights, fit };
})();
