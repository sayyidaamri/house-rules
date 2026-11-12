/* House Rules — home page */
(function () {
  const HR = window.HR;
  window.addEventListener("hr:ready", () => {
    const X = window.HRX; const { $, $$, E, tween, clamp, onScroll } = X;

    // ================= HERO =================
    const hero = $(".hero"), stage = $(".hero__stage", hero);
    const titleMain = $(".hero__title--main"), titleEcho = $(".hero__title--echo"), ill = $(".hero__ill img"), tag = $(".hero__tagline");
    const chars = X.splitChars(titleMain); X.splitChars(titleEcho);
    chars.forEach((c) => (c.style.transform = "translateY(105%)")); $$(".c", titleEcho).forEach((c) => (c.style.transform = "translateY(105%)"));
    ill.style.transform = "translateY(60%)"; ill.style.opacity = 0; tag.style.opacity = 0;
    X.fitAll();

    // three.js pieces: one scene, two layers (behind the title / in front of the portrait)
    let pieces = [], heroGL = null;
    if (window.THREE && window.HRP) {
      const T = THREE, P = HRP;
      const mk = (canvas) => { const r = P.renderer(canvas); const s = new T.Scene(); P.lights(s); return { r, s, canvas }; };
      const back = mk($(".hero__canvas--back")), front = mk($(".hero__canvas--front"));
      const cam = new T.PerspectiveCamera(22, 1, 0.1, 100); cam.position.set(0, 0, 30);
      // world units: stage width maps to W
      const visW = () => 2 * Math.tan((cam.fov * Math.PI) / 360) * 30 * cam.aspect;
      const defs = [
        { make: () => P.card("face", "back"), layer: back, x: 0.497, y: 0.17, h: 0.085, rot: [0.1, 0.3, -0.12], spin: 0.25 },
        { make: () => P.king(), layer: front, x: 0.085, y: 0.43, h: 0.2, rot: [0.15, 0.4, 0.28], spin: 0.15 },
        { make: () => P.pawn(), layer: front, x: 0.215, y: 0.31, h: 0.095, rot: [0.25, 0.2, 0.36], spin: 0.2 },
        { make: () => P.rook(), layer: front, x: 0.815, y: 0.315, h: 0.105, rot: [0.2, 0.5, -0.12], spin: 0.18 },
        { make: () => P.die(), layer: front, x: 0.905, y: 0.4, h: 0.065, rot: [0.5, 0.7, 0.2], spin: 0.3 },
        { make: () => P.coin(), layer: front, x: 0.18, y: 0.585, h: 0.05, rot: [1.25, 0, 0.3], spin: 0.35 },
        { make: () => P.card("face", "back"), layer: front, x: 0.83, y: 0.545, h: 0.105, rot: [0.1, -0.35, -0.22], spin: 0.2 },
        { make: () => P.die(), layer: back, x: 0.69, y: 0.27, h: 0.022, rot: [0.6, 0.4, 0.1], spin: 0.5 },
        { make: () => P.coin(), layer: front, x: 0.665, y: 0.62, h: 0.03, rot: [1.1, 0, -0.4], spin: 0.4 },
        { make: () => P.die(), layer: front, x: 0.33, y: 0.62, h: 0.022, rot: [0.3, 0.9, 0.5], spin: 0.5 },
      ];
      defs.forEach((d, i) => { const o = d.make(); const wrap = new T.Group(); wrap.add(o); d.layer.s.add(wrap); const b = new T.Box3().setFromObject(o); const c = b.getCenter(new T.Vector3()); o.position.sub(c); pieces.push({ ...d, o, wrap, baseH: Math.max(b.max.y - b.min.y, b.max.x - b.min.x, b.max.z - b.min.z), seed: i * 1.7, enter: 0 }); });
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });
      let sy = 0; onScroll((y) => (sy = y));
      const size = () => { [back, front].forEach((L) => P.fit(L.r, cam, stage)); };
      size(); addEventListener("resize", size);
      let visible = true; new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(stage);
      const clock = new T.Clock();
      heroGL = { pieces };
      const loop = () => {
        requestAnimationFrame(loop); if (!visible) return;
        const t = clock.getElapsedTime(); mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
        const W = visW(), H = W / cam.aspect, sw = stage.clientWidth, ppu = sw / W;
        pieces.forEach((p) => {
          const k = E.out(p.enter);
          const s = (p.h * W) / p.baseH; p.wrap.scale.setScalar(s * (0.4 + 0.6 * k));
          const par = p.layer === front ? 0.18 : 0.38; // pieces drift slower than the page
          const x = (p.x - 0.5) * W + mouse.x * (p.layer === front ? 0.6 : 0.3);
          const y = -(p.y * (stage.clientHeight / sw) * W - H / 2) + (sy * par) / ppu - mouse.y * 0.4 + Math.sin(t * 0.8 + p.seed) * 0.12 - (1 - k) * 6;
          p.wrap.position.set(x, y, 0);
          p.o.rotation.set(p.rot[0] + Math.sin(t * p.spin + p.seed) * 0.12 + mouse.y * 0.3, p.rot[1] + t * p.spin * 0.25 + mouse.x * 0.5 + (1 - k) * 3, p.rot[2] + Math.cos(t * p.spin + p.seed) * 0.08);
        });
        back.r.render(back.s, cam); front.r.render(front.s, cam);
      };
      loop();
    }

    X.onIntro(async () => {
      tween(1600, (k) => { ill.style.transform = `translateY(${(1 - k) * 60}%)`; ill.style.opacity = Math.min(1, k * 2); }, E.out);
      X.animIn(chars, { y: 105, stagger: 45, dur: 1300, delay: 350 });
      X.animIn($$(".c", titleEcho), { y: 105, stagger: 45, dur: 1300, delay: 350 });
      tween(900, (k) => (tag.style.opacity = k), E.out, 900);
      pieces.forEach((p, i) => tween(1500, (k) => (p.enter = k), E.lin, 700 + i * 90));
    });

    // scroll parallax: echo lags behind the title, portrait drifts slower and tilts back
    onScroll((y) => {
      const h = hero.offsetHeight; if (y > h * 1.5) return;
      titleEcho.parentElement.style.setProperty("--e", y);
      titleEcho.style.translate = `0 ${y * 0.42}px`;
      ill.style.translate = `0 ${y * 0.45}px`;
      ill.style.scale = String(1 - Math.min(y / h, 1) * 0.06);
    });

    // ================= PORTAL =================
    const portal = $(".portal"), pst = $(".portal__stage"), painting = $(".portal__painting"), ptext = $(".portal__text"), cv = $(".portal__paint"), track = $(".portal__track > span");
    ptext.innerHTML = ptext.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    const words = $$(".w", ptext);
    const ctx = cv.getContext("2d");
    // torn edge: fixed jitter per perimeter sample
    const N = 220, jit = Array.from({ length: N }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1);
    const jag = jit.map((v, i) => Math.abs(v) * 0.6 + Math.abs(Math.sin(i * 0.37)) * 0.4);
    function drawPaint(prog, rect) {
      const w = cv.width = innerWidth * Math.min(devicePixelRatio, 2), h = cv.height = innerHeight * Math.min(devicePixelRatio, 2); const sc = w / innerWidth;
      ctx.clearRect(0, 0, w, h); if (prog <= 0) return;
      const cx = (rect.left + rect.width / 2) * sc, cy = (rect.top + rect.height / 2) * sc;
      const grow = E.io(prog);
      const hw = (rect.width / 2) * sc * (1 + grow * 2.6) + grow * w * 0.1, hh = (rect.height / 2) * sc * (1 + grow * 1.4) + grow * h * 0.2;
      const amp = (10 + 60 * Math.sin(Math.PI * Math.min(prog * 1.1, 1))) * sc * Math.min(1, innerWidth / 1100) ;
      ctx.fillStyle = "#fdffff"; ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2; const ca = Math.cos(a), sa = Math.sin(a);
        const k = Math.min(hw / Math.abs(ca || 1e-6), hh / Math.abs(sa || 1e-6)); // point on rect
        const r = k + amp * jag[i] * (0.6 + 0.4 * Math.sin(i * 0.9 + prog * 4));
        const x = cx + ca * r, y = cy + sa * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    }
    onScroll(() => {
      const r = portal.getBoundingClientRect(); const total = portal.offsetHeight - innerHeight; const p = clamp(-r.top / total, 0, 1);
      track.style.transform = `scaleX(${p})`;
      // words fade out one by one
      const wp = clamp((p - 0.18) / 0.27, 0, 1); words.forEach((w, i) => (w.style.opacity = i / words.length < wp ? 0 : 1));
      const paintP = clamp((p - 0.42) / 0.4, 0, 1);
      painting.style.transform = `scale(${1 + E.io(clamp((p - 0.5) / 0.45, 0, 1)) * 3.2})`;
      drawPaint(paintP, painting.getBoundingClientRect());
      pst.dataset.tone = paintP > 0.55 ? "light" : "dark";
      $$(".portal__cue", pst)[0].style.opacity = p > 0.96 ? 0 : 1;
    });

    // ================= FEATURED =================
    const feat = HR.GAMES.filter((g) => g.featured && !g.big).slice(0, 5); const big = HR.GAMES.find((g) => g.big);
    const list = [feat[0], feat[1], feat[2], feat[3], big, feat[4]];
    const grid = $(".grid--featured");
    grid.innerHTML = list.map((g) => X.gameCard(g, g === big)).join("") +
      `<a class="filler" href="collection.html"><span class="filler__art"></span><span class="filler__count">${HR.GAMES.length} games on the shelf</span><span class="filler__foot"><span class="filler__title">The whole collection</span><span class="filler__arrow">→</span></span></a>`;
    grid.dataset.odd = "true";
    const fillerStyle = document.createElement("style"); fillerStyle.textContent = ".grid--featured .filler{display:none}@media (max-width:1080px){.grid--featured .filler{display:flex}}"; document.head.appendChild(fillerStyle);
    // cards fade/rise in as the grid enters
    const gio = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; gio.unobserve(e.target); const el = e.target; tween(1100, (k) => { el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 40}px)`; }, E.out, (+el.dataset.i % 3) * 90); }), { rootMargin: "0px 0px -8% 0px" });
    $$(".gcard, .filler", grid).forEach((c, i) => { c.dataset.i = i; c.style.opacity = 0; gio.observe(c); });

    // ================= DECK =================
    const S = HR.STATS; const fmtH = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
    const longestM = HR.nightMins(S.longest);
    const cards = [
      { t: "Most played", v: S.mostPlayed.name, s: `${S.mostPlayedCount} plays`, gold: true },
      { t: "Most wins", v: S.champ, s: `${S.champWins} wins`, x: `${S.champRate}%`, c: `across ${S.nights} nights`, gold: true },
      { t: "Games on the shelf", v: String(HR.GAMES.length), s: "Games" },
      { t: "Longest night", v: fmtH(longestM), s: HR.fmtLong(S.longest.date).replace(/,.*/, "") + ", " + S.longest.date.getFullYear() },
      { t: "Total time played", v: fmtH(S.totalMins), s: `${S.nights} nights` },
      { t: "The regulars", v: String(S.regulars), s: "Players", c: `Never missing: ${S.champ}, ${S.seats[S.champ]} nights` },
      { t: "Average night", v: fmtH(S.avg), s: "Per night" },
      { t: "Favourite genre", v: S.favGenre, s: `${S.favGenreCount} plays` },
      { t: "Busiest night", v: S.busyDay, s: `${S.busyCount} nights` },
    ];
    const deck = $(".deck"), cardsEl = $(".deck__cards");
    cardsEl.innerHTML = cards.map((c) => `<div class="pcard"><div class="pcard__face"><div class="stat">${X.cardBorder(c.gold ? "#f7b538" : "#7f97b3")}<p class="stat__title">${c.t}</p><img class="stat__sep" src="assets/img/separator-soft.svg" alt=""><p class="stat__value">${c.v}</p>${c.s ? `<p class="stat__sub">${c.s}</p>` : ""}${c.x ? `<p class="stat__extra">${c.x}</p>` : ""}${c.c ? `<p class="stat__cap">${c.c}</p>` : ""}</div></div></div>`).join("");
    const faces = $$(".pcard__face", cardsEl); const letters = $$(".deck__l", deck);
    const from = faces.map((_, i) => ({ x: (i % 2 ? 1 : -1) * (40 + (i * 13) % 30), y: 70 + (i * 7) % 30, r: (i % 2 ? 1 : -1) * (25 + i * 3) }));
    const rest = faces.map((_, i) => (i === 0 ? 0 : ((i * 37) % 9) - 4));
    const drag = faces.map(() => ({ x: 0, y: 0, tx: 0, ty: 0, r: 0 }));
    let z = 10;
    function deckFrame() {
      const r = deck.getBoundingClientRect(); const total = deck.offsetHeight - innerHeight; const p = clamp(-r.top / total, 0, 1);
      const lp = clamp((innerHeight - r.top) / innerHeight, 0, 1);
      letters.forEach((l, i) => (l.style.transform = `translateY(${(1 - E.out(clamp(lp * 1.6 - i * 0.12, 0, 1))) * 105}%)`));
      faces.forEach((f, i) => {
        const order = [8, 1, 2, 3, 4, 5, 6, 7, 0].indexOf(i); // centre card lands last
        const k = E.out(clamp((p - 0.06 - order * 0.045) / 0.18, 0, 1));
        const d = drag[i]; const fr = from[i];
        f.style.transform = `translate(${(1 - k) * fr.x}vw, ${(1 - k) * fr.y}vh) rotate(${(1 - k) * fr.r + rest[i] + d.r}deg) translate(${d.x}px, ${d.y}px)`;
        f.style.opacity = k > 0 ? 1 : 0;
      });
    }
    onScroll(deckFrame); deckFrame();
    faces.forEach((f, i) => {
      let sx, sy, ox, oy, lx, vx = 0, raf;
      f.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" && !X.fine) return;
        e.preventDefault(); f.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; ox = drag[i].x; oy = drag[i].y; lx = e.clientX;
        f.parentElement.style.zIndex = ++z; f.style.transition = "none";
        const settle = () => { drag[i].r += (vx * 0.6 - drag[i].r) * 0.15; vx *= 0.85; deckFrame(); if (Math.abs(drag[i].r) > 0.05 || Math.abs(vx) > 0.05) raf = requestAnimationFrame(settle); };
        const mv = (ev) => { drag[i].x = ox + ev.clientX - sx; drag[i].y = oy + ev.clientY - sy; vx = clamp(ev.clientX - lx, -30, 30); lx = ev.clientX; cancelAnimationFrame(raf); raf = requestAnimationFrame(settle); };
        const up = () => { f.removeEventListener("pointermove", mv); f.removeEventListener("pointerup", up); f.removeEventListener("pointercancel", up); };
        f.addEventListener("pointermove", mv); f.addEventListener("pointerup", up); f.addEventListener("pointercancel", up);
      });
    });

    // ================= TABLE / LOG =================
    const latest = HR.NIGHTS[HR.NIGHTS.length - 1];
    $(".table__featured").innerHTML = X.sessionFrame(latest); X.animateSession($(".table"));
    const recent = HR.NIGHTS.slice(-11, -1).reverse();
    const ol = $(".archive__list"); ol.innerHTML = recent.map((n, i) => X.nightRow(n, i, { index: i + 1 })).join("");
    X.bindRows(ol); X.animateLedgers(ol);
    X.initRolls(document);
  });
})();
