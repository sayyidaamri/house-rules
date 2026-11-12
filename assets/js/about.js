/* House Rules — about page: board hero, crafts carousel, the die that picks your table */
(function () {
  const HR = window.HR;
  window.addEventListener("hr:ready", () => {
    const X = window.HRX; const { $, $$, E, tween, clamp, onScroll } = X;
    const T = window.THREE, P = window.HRP;
    const title = $(".ahero__title"); const chars = X.splitChars(title); chars.forEach((c) => (c.style.transform = "translateY(105%)")); X.fitAll();
    X.onIntro(() => X.animIn(chars, { y: 105, stagger: 40, dur: 1300, delay: 200 }));
    if (!T || !P) return;
    const visibleOf = (el) => { const st = { on: true }; new IntersectionObserver((e) => (st.on = e[0].isIntersecting)).observe(el); return st; };

    // ================= HERO: pieces on a tiled board =================
    (function heroScene() {
      const host = $(".ahero__stage"), canvas = $("canvas", host); const r = P.renderer(canvas); const s = new T.Scene(); P.lights(s);
      const cam = new T.PerspectiveCamera(34, 1, 0.1, 200); cam.position.set(0, 4.2, 13); cam.lookAt(0, 1.4, 0);
      // board: tiles + gold seams
      const tileGeo = new T.PlaneGeometry(1.94, 1.94); const mA = new T.MeshBasicMaterial({ color: 0x0b3d6e }), mB = new T.MeshBasicMaterial({ color: 0x08335d });
      const board = new T.Group();
      for (let i = -14; i < 14; i++) for (let j = -22; j < 6; j++) { const t = new T.Mesh(tileGeo, (i + j) % 2 ? mA : mB); t.rotation.x = -Math.PI / 2; t.position.set(i * 2 + 1, 0, j * 2 + 1); board.add(t); }
      const lineMat = new T.LineBasicMaterial({ color: 0xc98f2e, transparent: true, opacity: 0.55 });
      const pts = []; for (let i = -14; i <= 14; i++) { pts.push(new T.Vector3(i * 2, 0.002, -44), new T.Vector3(i * 2, 0.002, 12)); } for (let j = -22; j <= 6; j++) { pts.push(new T.Vector3(-28, 0.002, j * 2), new T.Vector3(28, 0.002, j * 2)); }
      board.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), lineMat)); s.add(board);
      s.fog = new T.Fog(0x08335d, 18, 46);
      const items = [
        { o: P.pawn(), x: -0.4, z: 1.6, h: 3.9, ry: 0.3 },
        { o: P.rook(), x: -6.6, z: -1.5, h: 2.6, ry: 0.6 },
        { o: P.king(), x: 7.6, z: -3.5, h: 3.4, ry: -0.4 },
        { o: P.die(), x: 6.0, z: 2.2, h: 1.25, ry: 0.5, die: true },
        { o: P.card(), x: -8.4, z: 2.6, h: 1.4, ry: 0.4, flat: true },
        { o: P.pawn(), x: -10.5, z: -6, h: 1.8, ry: 0 },
        { o: P.pawn(), x: 11.5, z: -8, h: 2.0, ry: 0.2 },
      ];
      items.forEach((it, i) => { const g = new T.Group(); it.o.scale.setScalar(it.h); if (it.die) it.o.position.y = it.h / 2; if (it.flat) { it.o.rotation.x = -Math.PI / 2 + 0.05; it.o.position.y = 0.05; } g.add(it.o); const sh = P.shadow(it.h * 0.55, 0.45); sh.position.set(0.25 * it.h, 0.01, -0.1 * it.h); g.add(sh); g.position.set(it.x, 0, it.z); g.rotation.y = it.ry; s.add(g); it.g = g; it.drop = 0; });
      const vis = visibleOf(host); const m = { x: 0, y: 0, tx: 0, ty: 0 };
      addEventListener("pointermove", (e) => { m.tx = e.clientX / innerWidth - 0.5; m.ty = e.clientY / innerHeight - 0.5; });
      let sy = 0; onScroll((y) => (sy = y));
      const size = () => P.fit(r, cam, host); size(); addEventListener("resize", size);
      X.onIntro(() => items.forEach((it, i) => tween(1400, (k) => (it.drop = k), E.out, 350 + i * 90)));
      const clk = new T.Clock();
      (function loop() { requestAnimationFrame(loop); if (!vis.on) return; const t = clk.getElapsedTime(); m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
        const nar = cam.aspect < 1 ? (1 - cam.aspect) * 16 : 0; cam.position.set(m.x * 2.2, 4.2 + m.y * 1.1 + sy * 0.003 + nar * 0.12, 13 + nar - sy * 0.004); cam.lookAt(m.x * 0.8, 1.4 + nar * 0.06, 0);
        items.forEach((it, i) => { it.g.position.y = (1 - E.back(it.drop)) * 6 * (it.drop > 0 ? 1 : 2) + (it.drop < 1 ? 0 : 0); it.g.visible = it.drop > 0; it.o.rotation.y = it.die ? 0.4 + Math.sin(t * 0.4) * 0.15 : Math.sin(t * 0.3 + i) * 0.08; });
        r.render(s, cam); })();
    })();

    // ================= CRAFTS =================
    (function crafts() {
      const sec = $(".crafts"), host = $(".crafts__stage"), canvas = $("canvas", host); const r = P.renderer(canvas); const s = new T.Scene(); P.lights(s);
      const cam = new T.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 3.2, 9.5); cam.lookAt(0, 0.9, 0);
      const anchor = new T.Group(); s.add(anchor);
      const ring = P.ring(2.3); anchor.add(ring);
      const sh = P.shadow(1.6, 0.18); sh.position.set(0.6, 0.005, -0.3); anchor.add(sh);
      const mk = [
        () => { const g = new T.Group(); const c = P.card("back", "back"); c.scale.setScalar(2.6); c.position.y = 1.35; c.rotation.set(-0.08, -0.35, 0.04); g.add(c); return g; },
        () => { const g = new T.Group(); const k = P.king(P.C.navy, P.C.gold); k.scale.setScalar(2.9); g.add(k); return g; },
        () => { const g = new T.Group(); const b = P.book(); b.scale.setScalar(1.25); b.position.y = 0.95; b.rotation.set(-0.25, 0.25, -0.35); g.add(b); return g; },
        () => { const g = new T.Group(); const st = P.chipStack(5); st.scale.setScalar(0.85); st.position.set(-0.75, 0.05, 0); const d = P.die(); d.scale.setScalar(1.05); d.position.set(0.9, 0.53, 0.1); d.rotation.set(0.1, 0.5, 0); const st2 = P.chipStack(2); st2.scale.setScalar(0.85); st2.position.set(-0.75, 1.15, -0.1); st2.rotation.z = 0.2; g.add(st, d); return g; },
      ];
      const objs = mk.map((f) => { const o = f(); o.visible = false; anchor.add(o); return { o, k: 0 }; });
      const chapters = $$(".chapter", sec), items = $$(".crafts__item", sec), track = $(".crafts__track > span", sec);
      let cur = -1;
      function show(i) {
        if (i === cur) return; const prev = cur; cur = i;
        chapters.forEach((c, j) => (c.dataset.active = j === i ? "true" : j < i ? "false" : "idle"));
        items.forEach((b, j) => (j === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
        if (prev >= 0) { const p = objs[prev]; tween(600, (k) => { p.o.position.y = -k * 3; p.o.rotation.y = k * 1.5; }, E.inn).then(() => { if (cur !== prev) p.o.visible = false; }); }
        const n = objs[i]; n.o.visible = true; tween(1100, (k) => { n.o.position.y = (1 - k) * 3.5; n.o.rotation.y = (1 - k) * -2.2; n.o.scale.setScalar(0.7 + 0.3 * k); }, E.out, prev >= 0 ? 260 : 0);
      }
      show(0);
      onScroll(() => { const rr = sec.getBoundingClientRect(); const total = sec.offsetHeight - innerHeight; const p = clamp(-rr.top / total, 0, 0.9999); track.style.transform = `scaleX(${p})`; show(Math.floor(p * 4)); });
      items.forEach((b, j) => b.addEventListener("click", () => { const top = sec.getBoundingClientRect().top + scrollY; const y = top + (sec.offsetHeight - innerHeight) * ((j + 0.5) / 4); X.lenis ? X.lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: "smooth" }); }));
      const vis = visibleOf(sec); const size = () => { P.fit(r, cam, host); const wide = innerWidth > 760; anchor.position.x = wide ? 1.55 : 0; anchor.position.y = wide ? -0.6 : 0.55; anchor.scale.setScalar(wide ? 0.9 : Math.max(0.42, (innerWidth / innerHeight) * 0.95)); }; size(); addEventListener("resize", size);
      const clk = new T.Clock();
      (function loop() { requestAnimationFrame(loop); if (!vis.on) return; const t = clk.getElapsedTime(); ring.rotation.y = t * 0.12; if (cur >= 0) objs[cur].o.children[0].rotation.y += 0.0; anchor.rotation.y = Math.sin(t * 0.35) * 0.18; r.render(s, cam); })();
    })();

    // ================= DICE: roll your table =================
    (function dice() {
      const sec = $(".dplay"), host = $(".dplay__stage"), canvas = $("canvas", host); const r = P.renderer(canvas); const s = new T.Scene(); P.lights(s);
      const cam = new T.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 5.5, 9); cam.lookAt(0, 0.6, 0);
      const anchor = new T.Group(); s.add(anchor);
      const ring = P.ring(1.7); anchor.add(ring);
      const die = P.die(); die.scale.setScalar(1.3); const dieWrap = new T.Group(); dieWrap.add(die); dieWrap.position.y = 1.3; anchor.add(dieWrap);
      const sh = P.shadow(1.1, 0.35); sh.position.y = 0.01; anchor.add(sh);
      // splash under the die (re-coloured per world)
      const splashC = document.createElement("canvas"); splashC.width = splashC.height = 512; const sx = splashC.getContext("2d");
      const splashTex = new T.CanvasTexture(splashC); const splash = new T.Mesh(new T.PlaneGeometry(5.5, 5.5), new T.MeshBasicMaterial({ map: splashTex, transparent: true, depthWrite: false })); splash.rotation.x = -Math.PI / 2; splash.position.y = 0.003; splash.scale.setScalar(0.001); anchor.add(splash);
      function paintSplash(color) { sx.clearRect(0, 0, 512, 512); sx.fillStyle = color; sx.beginPath(); for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; const rr = 150 + Math.abs(Math.sin(i * 7.31) * 60) + (i % 3 ? 0 : Math.random() * 70); const x = 256 + Math.cos(a) * rr, y = 256 + Math.sin(a) * rr; i ? sx.lineTo(x, y) : sx.moveTo(x, y); } sx.closePath(); sx.fill(); for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, d = 200 + Math.random() * 50; sx.beginPath(); sx.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 2 + Math.random() * 6, 0, 7); sx.fill(); } splashTex.needsUpdate = true; }
      // decor sets per world
      const decor = new T.Group(); anchor.add(decor);
      const decorFor = (n) => { decor.clear(); const add = (o, x, y, z, sc, rx = 0, ry = 0, rz = 0) => { o.scale.setScalar(sc); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.userData.y = y; decor.add(o); };
        const sets = {
          1: () => { const b = P.book(); add(b, -2.4, 0.7, 0.2, 0.75, -1.2, 0.2, 0.1); add(P.pawn(), 2.3, 0, -0.3, 1.3); },
          2: () => { add(P.card(), -2.4, 0.06, 0.3, 1.1, -Math.PI / 2, 0, 0.5); add(P.card(), -1.9, 0.08, -0.6, 1.1, -Math.PI / 2, 0, -0.3); add(P.pawn(), 2.2, 0, -0.5, 1.2); add(P.pawn(), 2.6, 0, 0.1, 1.0); const c = P.chipStack(4); add(c, 2.2, 0, 0.9, 0.5); },
          3: () => { add(P.rook(), -2.3, 0, -0.2, 1.4); add(P.king(), 2.4, 0, -0.4, 1.8); },
          4: () => { add(P.card(), -2.6, 0.5, 0.1, 1.1, -0.9, 0.3, 0.6); add(P.card(), -2.0, 0.7, -0.3, 1.1, -0.7, -0.2, -0.3); [[-1.0, -1.2], [1.4, -1.0], [1.8, 0.8], [-1.4, 1.1]].forEach(([x, z]) => add(P.coin(P.C.navy, P.C.gold), x, 0.05, z, 0.55, 0.3, 0, 0.2)); },
          5: () => { add(P.pawn(), -2.2, 0, 0, 1.2); add(P.pawn(), -1.7, 0, -0.6, 1.2); add(P.pawn(), 2.2, 0, -0.2, 1.2); add(P.pawn(), 2.7, 0, 0.4, 1.2); },
          6: () => { add(P.king(), -2.4, 0, -0.3, 1.9); add(P.chipStack(6), 2.3, 0, -0.2, 0.55); add(P.coin(), 1.3, 0.05, 1.2, 0.5, 0.2); },
        }; sets[n](); decor.children.forEach((o, i) => { const y = o.userData.y; o.position.y = y - 3; tween(900, (k) => (o.position.y = y - 3 * (1 - k)), E.out, 200 + i * 80); }); };
      const WORLDS = { 1: ["#08335d", "#f7b538", "dark"], 2: ["#145a86", "#f7b538", "dark"], 3: ["#c98f2e", "#08335d", "dark"], 4: ["#08335d", "#f7b538", "dark"], 5: ["#fdffff", "#c98f2e", "light"], 6: ["#f7b538", "#08335d", "light"] };
      const SPLASH = { 1: "#145a86", 2: "#0b4a72", 3: "#b57c22", 4: "#f7b538", 5: "#e8eef4", 6: "#ffd07a" };
      const ROT = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [0, 0, Math.PI / 2], 5: [0, 0, -Math.PI / 2], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] };
      const num = $(".dplay__num", sec), pname = $(".dplay__pname", sec), pbody = $(".dplay__rcopy .dplay__pbody", sec), introEl = $(".dplay__intro", sec), cap = $(".dplay__cap", sec), btn = $(".rollbtn", sec), facesEl = $$(".face", sec);
      const met = new Set(); let rolling = false, idle = true;
      async function roll(push = 1) {
        if (rolling) return; rolling = true; idle = false; btn.disabled = true;
        const left = [1, 2, 3, 4, 5, 6].filter((n) => !met.has(n)); const n = left.length && Math.random() < 0.8 ? left[Math.floor(Math.random() * left.length)] : 1 + Math.floor(Math.random() * 6);
        // hide old readout
        [num, pname].forEach((el) => tween(350, (k) => (el.style.transform = `translateY(${-k * 110}%)`), E.inn)); tween(300, (k) => { pbody.style.opacity = 1 - k; introEl.style.opacity = 1 - k; }, E.inn);
        decor.children.forEach((o) => { const y0 = o.position.y; tween(450, (k) => (o.position.y = y0 - 3 * k), E.inn); });
        tween(400, (k) => splash.scale.setScalar(Math.max(0.001, splash.scale.x * (1 - k))), E.inn);
        const q0 = die.quaternion.clone(); const spin = new T.Euler(Math.random() * 8 + 6, Math.random() * 6, Math.random() * 8 + 6);
        const target = new T.Quaternion().setFromEuler(new T.Euler(...ROT[n])).premultiply(new T.Quaternion().setFromEuler(new T.Euler(0, Math.random() * 1.2 - 0.6, 0)));
        const tmp = new T.Quaternion();
        await tween(1500, (k, raw) => {
          dieWrap.position.y = 0.65 + Math.abs(Math.sin(raw * Math.PI * 2.2)) * 2.6 * (1 - raw) * push + (1 - raw) * 0.0;
          dieWrap.position.x = Math.sin(raw * 3) * 0.6 * (1 - raw);
          if (raw < 0.65) { die.rotation.set(spin.x * raw, spin.y * raw, spin.z * raw); tmp.copy(die.quaternion); }
          else { const kk = E.out((raw - 0.65) / 0.35); die.quaternion.copy(tmp).slerp(target, kk); }
        }, E.lin);
        die.quaternion.copy(target); dieWrap.position.y = 0.65;
        // world swap
        met.add(n); const [bg, accent, tone] = WORLDS[n];
        sec.style.setProperty("--world", bg); sec.style.setProperty("--accent", accent); sec.dataset.tone = tone;
        paintSplash(SPLASH[n]); tween(800, (k) => splash.scale.setScalar(Math.max(0.001, E.back(k))), E.lin);
        decorFor(n);
        facesEl.forEach((f) => { const v = +f.dataset.face; f.dataset.met = met.has(v); f.dataset.cur = v === n; });
        const leftN = 6 - met.size; cap.textContent = leftN ? `${leftN} table${leftN > 1 ? "s" : ""} left to find` : "Every table found. Roll again to revisit one.";
        const prof = HR.PROFILES[n - 1]; num.textContent = n; pname.textContent = prof.name; pbody.textContent = prof.body; introEl.style.display = "none";
        [num, pname].forEach((el, i) => tween(800, (k) => (el.style.transform = `translateY(${(1 - k) * 110}%)`), E.out, i * 90));
        tween(600, (k) => (pbody.style.opacity = k), E.out, 250);
        $(".nav").dataset.tone = tone === "light" ? "light" : "dark";
        btn.querySelector("span").textContent = "Roll again"; btn.disabled = false; rolling = false;
      }
      btn.addEventListener("click", () => roll());
      // drag-to-throw on the stage
      let down = null;
      host.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; host.setPointerCapture(e.pointerId); });
      host.addEventListener("pointermove", (e) => { if (!down || rolling) return; dieWrap.position.x = clamp((e.clientX - down.x) / 120, -1.5, 1.5); dieWrap.position.y = 1.3 + clamp((down.y - e.clientY) / 120, -0.5, 1.5); die.rotation.x += 0.03; });
      host.addEventListener("pointerup", (e) => { if (!down) return; const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y); const v = dist / Math.max(1, performance.now() - down.t); down = null; roll(clamp(0.8 + v, 0.8, 1.6)); });
      const vis = visibleOf(sec); const size = () => { P.fit(r, cam, host); anchor.position.x = innerWidth > 760 ? 2.6 : 0; }; size(); addEventListener("resize", size);
      const clk = new T.Clock();
      (function loop() { requestAnimationFrame(loop); if (!vis.on) return; const t = clk.getElapsedTime(); ring.rotation.y = t * 0.15; if (idle && !down) { die.rotation.x = t * 0.5; die.rotation.y = t * 0.7; dieWrap.position.y = 1.3 + Math.sin(t * 1.4) * 0.12; } r.render(s, cam); })();
      // nav tone follows world when pinned
      onScroll(() => { const rr = sec.getBoundingClientRect(); if (rr.top < 40 && rr.bottom > 40) $(".nav").dataset.tone = sec.dataset.tone; });
    })();
  });
})();
