/* House Rules — shared behaviour: smooth scroll, loader, page transitions, menu, navbar,
   rolling links, reveals, game modal, footer reveal. Vanilla JS, no build step. */
(function () {
  const HR = window.HR;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- tiny tween engine ----------
  const E = {
    out: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    io: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inn: (t) => t * t * t,
    cubicOut: (t) => 1 - Math.pow(1 - t, 3),
    back: (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    lin: (t) => t,
  };
  function tween(dur, fn, ease = E.out, delay = 0) {
    return new Promise((res) => {
      if (reduce) dur = Math.min(dur, 1);
      let t0 = null;
      const step = (now) => {
        if (t0 === null) t0 = now + delay;
        const t = clamp((now - t0) / dur, 0, 1);
        if (now >= t0) fn(ease(t), t);
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  // ---------- path helpers (works on file:// and http) ----------
  const pageName = () => { const p = location.pathname.split("/").pop() || "index.html"; return p.replace(/\.html$/, "") || "index"; };
  const href = (name) => (name === "index" ? "index.html" : name + ".html");

  // ---------- smooth scroll ----------
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    window.__lenis = lenis;
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollY = () => window.scrollY;
  const onScroll = (fn) => { const run = () => fn(scrollY()); if (lenis) lenis.on("scroll", run); window.addEventListener("scroll", run, { passive: true }); window.addEventListener("resize", run); return run; };
  const lockScroll = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); document.documentElement.style.overflow = on ? "hidden" : ""; };

  // ---------- rolling text ----------
  function roll(el) {
    if (el.dataset.rolled) return; el.dataset.rolled = 1;
    const t = el.textContent.trim();
    el.innerHTML = `<span class="roll" aria-hidden="true"><span>${t}</span><span>${t}</span></span><span class="vh">${t}</span>`;
    const host = el.closest("a,button") || el; host.classList.add("roll-host");
  }
  const initRolls = (root = document) => $$("[data-roll]", root).forEach(roll);

  // ---------- split helpers ----------
  function splitChars(el) {
    if (el.dataset.split) return $$(".c", el);
    el.dataset.split = 1; const text = el.textContent; el.setAttribute("aria-label", text); el.classList.add("chars");
    el.innerHTML = text.split("").map((ch) => (ch === " " ? " " : `<span class="cm" aria-hidden="true"><span class="c">${ch}</span></span>`)).join("");
    return $$(".c", el);
  }
  function splitLines(el) {
    if (el.dataset.split) return $$(".ln > span", el);
    el.dataset.split = 1;
    const parts = el.innerHTML.split(/<br\s*\/?>/i).map((h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.trim().split(/\s+/).filter(Boolean); });
    el.innerHTML = parts.map((ws) => ws.map((w) => `<span class="wd">${w}</span>`).join(" ")).join("<br>");
    const lines = []; let top = null;
    $$(".wd", el).forEach((w) => { const y = Math.round(w.offsetTop); if (y !== top) { lines.push([]); top = y; } lines[lines.length - 1].push(w.textContent); });
    el.innerHTML = lines.map((l) => `<span class="ln"><span>${l.join(" ")}</span></span>`).join("");
    return $$(".ln > span", el);
  }
  const animIn = (els, { y = 110, dur = 1000, stagger = 70, delay = 0, ease = E.out } = {}) =>
    Promise.all(els.map((el, i) => tween(dur, (k) => (el.style.transform = `translateY(${(1 - k) * y}%)`), ease, delay + i * stagger)));

  function initReveals(root = document) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (!en.isIntersecting) return; io.unobserve(en.target); const el = en.target;
      if (el.dataset.reveal === "lines") { const ls = splitLines(el); ls.forEach((l) => (l.style.transform = "translateY(110%)")); el.classList.add("is-in"); animIn(ls, { stagger: 90 }); }
      if (el.dataset.reveal === "chars") { const cs = splitChars(el); cs.forEach((c) => (c.style.transform = "translateY(105%)")); animIn(cs, { y: 105, stagger: 28, dur: 1100 }); }
      if (el.dataset.reveal === "fade") { el.style.opacity = 0; tween(900, (k) => { el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 24}px)`; }); }
      if (el.dataset.reveal === "rule") { el.style.transformOrigin = "0 50%"; tween(1100, (k) => (el.style.transform = `scaleX(${k})`), E.io); }
    }), { rootMargin: "0px 0px -10% 0px" });
    $$("[data-reveal]", root).forEach((el) => {
      if (el.dataset.reveal === "chars") splitChars(el).forEach((c) => (c.style.transform = "translateY(105%)"));
      if (el.dataset.reveal === "rule") el.style.transform = "scaleX(0)";
      if (el.dataset.reveal === "fade") el.style.opacity = 0;
      io.observe(el);
    });
  }

  // ---------- fit display titles (condensed look with a free face) ----------
  function fitAll() {
    $$("[data-fit]").forEach((el) => {
      const box = el.parentElement; el.style.transform = "none"; el.style.width = "max-content";
      if (el.dataset.fitMode === "font") el.style.fontSize = "";
      const target = box.clientWidth * parseFloat(el.dataset.fit || 1);
      let w = el.getBoundingClientRect().width; if (!w) return;
      if (el.dataset.fitMode === "font") { const fs = parseFloat(getComputedStyle(el).fontSize); el.style.fontSize = (fs * target) / w + "px"; w = el.getBoundingClientRect().width; }
      const s = target / w; let sy = parseFloat(el.dataset.fitSy || 1);
      if (el.dataset.fitCap) { const fs = parseFloat(getComputedStyle(el).fontSize); sy = (parseFloat(el.dataset.fitCap) * box.clientWidth) / (0.69 * fs); }
      el.style.transformOrigin = el.dataset.fitOrigin || "0 0";
      el.style.transform = `scale(${s}, ${sy})`;
      if (sy !== 1 && el.dataset.fitGrow !== "no") { const cs = getComputedStyle(box); box.style.height = el.offsetHeight * sy + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + "px"; }
    });
  }

  // ---------- loader & intro ----------
  const pageIntro = [];
  const onIntro = (fn) => pageIntro.push(fn);
  async function runIntro() { for (const fn of pageIntro) fn(); }

  async function loader() {
    const L = $(".loader"); const T = $(".ptrans");
    const fromNav = sessionStorage.getItem("hr-trans") === "1"; sessionStorage.removeItem("hr-trans");
    if (fromNav && T) { L && L.remove(); await transitionOut(); return; }
    if (!L) return;
    lockScroll(true);
    const mark = $(".loader__mark", L);
    if (document.fonts) await Promise.race([document.fonts.ready, wait(1500)]);
    await tween(900, (k) => (mark.style.clipPath = `inset(${(1 - k) * 100}% 0 0 0)`), E.io, 150);
    await wait(900);
    tween(500, (k) => { mark.style.opacity = 1 - k; mark.style.transform = `translateY(${-k * 30}px)`; }, E.inn);
    await wait(250);
    await tween(1000, (k) => (L.style.transform = `translateY(${-k * 112}%) rotate(${-k * 6}deg)`), E.io);
    L.remove(); lockScroll(false);
  }
  async function transitionIn(url) {
    const T = $(".ptrans"); if (!T) { location.href = url; return; }
    T.classList.add("is-on"); const layers = $$(".ptrans__layer", T); const mark = $(".ptrans__mark", T);
    layers.forEach((l) => (l.style.transform = "translateY(118%) rotate(6deg)"));
    await Promise.all(layers.map((l, i) => tween(900, (k) => (l.style.transform = `translateY(${(1 - k) * 118}%) rotate(${(1 - k) * 6}deg)`), E.io, i * 90)));
    await tween(500, (k) => (mark.style.transform = `translateY(${(1 - k) * 110}%)`), E.out);
    sessionStorage.setItem("hr-trans", "1");
    await wait(120);
    location.href = url;
  }
  async function transitionOut() {
    const T = $(".ptrans"); T.classList.add("is-on"); const layers = $$(".ptrans__layer", T); const mark = $(".ptrans__mark", T);
    layers.forEach((l) => (l.style.transform = "none")); mark.style.transform = "none";
    await wait(380);
    await tween(420, (k) => (mark.style.transform = `translateY(${-k * 110}%)`), E.inn);
    const rev = layers.slice().reverse();
    await Promise.all(rev.map((l, i) => tween(1000, (k) => (l.style.transform = `translateY(${-k * 118}%) rotate(${-k * 6}deg)`), E.io, i * 90)));
    T.classList.remove("is-on"); layers.forEach((l) => (l.style.transform = "translateY(118%)"));
  }
  function bindLinks() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const h = a.getAttribute("href"); if (!h || h.startsWith("#") || h.startsWith("mailto:") || /^https?:/.test(h)) return;
      e.preventDefault();
      const cur = location.pathname.split("/").pop() || "index.html";
      if (h === cur && !h.includes("?")) { closeMenu(); lenis ? lenis.scrollTo(0, { duration: 1.2 }) : scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (menuOpen) closeMenu(true);
      transitionIn(h);
    });
  }

  // ---------- menu ----------
  let menuOpen = false, menuBusy = false;
  async function openMenu() {
    if (menuBusy) return; menuBusy = true; menuOpen = true;
    const M = $(".menu"), B = $(".nav__btn"); M.classList.add("is-open"); B.classList.add("is-open"); B.setAttribute("aria-expanded", "true");
    $(".nav").dataset.hidden = "false"; $(".nav").dataset.tone = "dark"; lockScroll(true);
    const bgs = $$(".menu__bg", M); const items = $(".menu__items", M); const lines = $$(".mask > *", M);
    lines.forEach((l) => (l.style.transform = "translateY(110%)")); items.style.visibility = "visible";
    bgs.forEach((b, i) => tween(1000, (k) => (b.style.transform = `rotate(${(1 - k) * 90}deg)`), E.io, i * 80));
    await wait(560);
    await animIn(lines, { stagger: 45, dur: 1000 });
    menuBusy = false;
  }
  async function closeMenu(fast) {
    if (!menuOpen) return; menuBusy = true; menuOpen = false;
    const M = $(".menu"), B = $(".nav__btn"); B.classList.remove("is-open"); B.setAttribute("aria-expanded", "false");
    const bgs = $$(".menu__bg", M).reverse(); const items = $(".menu__items", M); const lines = $$(".mask > *", M);
    lines.forEach((l, i) => tween(450, (k) => (l.style.transform = `translateY(${-k * 110}%)`), E.inn, i * 20));
    await wait(fast ? 0 : 300);
    await Promise.all(bgs.map((b, i) => tween(900, (k) => (b.style.transform = `rotate(${k * 90}deg)`), E.io, i * 70)));
    items.style.visibility = "hidden"; M.classList.remove("is-open"); lockScroll(false); menuBusy = false; navTone();
  }

  // ---------- navbar hide/tone ----------
  let lastY = 0;
  function navTone() {
    const nav = $(".nav"); if (!nav || menuOpen) return;
    const y = 30; const els = document.elementsFromPoint(innerWidth - 30, y).filter((e) => !e.closest(".nav,.menu,.ptrans,.modal"));
    const sec = els.map((e) => e.closest("[data-tone]")).find(Boolean);
    nav.dataset.tone = sec ? sec.dataset.tone : "dark";
  }
  function bindNav() {
    $(".nav__btn").addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen) closeMenu(); });
    onScroll((y) => {
      const nav = $(".nav"); if (menuOpen) return;
      if (y > lastY + 4 && y > 120) nav.dataset.hidden = "true"; else if (y < lastY - 4) nav.dataset.hidden = "false";
      lastY = y; navTone();
    });
    navTone();
  }

  // ---------- markup builders shared by pages ----------
  const paint4 = (cls) => `<span class="${cls}"></span><span class="${cls}"></span><span class="${cls}"></span><span class="${cls}"></span>`;
  function gameCard(g, big) {
    const sub = `<span>${g.players}</span><i class="diamond"></i><span>${g.genres.join(" / ")}</span>`;
    return `<button class="gcard${big ? " gcard--big" : ""}" type="button" data-game="${g.id}" aria-label="${g.name}, open details">${paint4("gcard__paint")}
      <span class="gcard__img"><img src="assets/img/${g.img}.jpg" alt="" loading="lazy" decoding="async"></span>
      <span class="gcard__meta"><span class="gcard__info"><span class="gcard__title">${g.name}</span><span class="gcard__sub">${sub}</span></span></span></button>`;
  }
  function nightRow(n, i, opts = {}) {
    const mins = HR.nightMins(n); const wins = HR.nightWinners(n);
    const names = n.games.map((g) => HR.game(g.id).name);
    const ledger = n.games.map((g) => `<i style="flex-grow:${g.mins}"></i>`).join("");
    const maxMin = Math.max(...n.games.map((g) => g.mins));
    const slip = n.games.map((g) => `<li><p class="slip__title">${HR.game(g.id).name}</p>${g.winners.length ? `<p class="slip__win"><em>Won by</em> ${g.winners.join(", ")}</p>` : `<p class="slip__none">No winner recorded</p>`}<p class="slip__time"><span class="slip__bar"><i style="width:${(g.mins / maxMin) * 100}%"></i></span><span class="slip__dur">${HR.fmtMins(g.mins)}</span></p></li>`).join("");
    const idx = opts.index != null ? String(opts.index).padStart(2, "0") : String(n.no).padStart(2, "0");
    return `<li class="entry" data-night="${n.no}">
      <button class="row" type="button" aria-expanded="false">
        <span class="row__idx">${idx}</span>
        <span class="row__date">${HR.fmtDate(n.date)}</span>
        <span class="row__sum"><span class="row__games">${names.join('<i class="diamond"></i>')}</span><span class="row__players">${n.players.join(", ")}</span></span>
        <span class="row__out"><span class="row__win">${wins.length ? wins.join(", ") : "—"}</span></span>
        <span class="row__dur">${HR.fmtMins(mins)}</span>
        <span class="row__ledger" aria-hidden="true"><span class="row__fill" style="width:${clamp(mins / 240, 0.08, 1) * 100}%">${ledger}</span></span>
      </button>
      <div class="entry__shell"><div class="entry__reveal"><div class="slip"><ul>${slip}</ul></div></div></div></li>`;
  }
  function bindRows(root) {
    $$(".entry", root).forEach((en) => {
      const btn = $(".row", en), shell = $(".entry__shell", en), rev = $(".entry__reveal", en);
      btn.addEventListener("click", () => toggleRow(en));
    });
  }
  async function toggleRow(en, force) {
    const btn = $(".row", en), shell = $(".entry__shell", en), rev = $(".entry__reveal", en);
    const open = force != null ? force : !btn.classList.contains("is-open");
    if (open === btn.classList.contains("is-open")) return;
    btn.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open);
    const h = rev.scrollHeight;
    const bars = $$(".slip__bar i", en);
    if (open) {
      bars.forEach((b) => (b.style.transform = "scaleX(0)"));
      tween(700, (k) => (shell.style.height = k * h + "px"), E.io).then(() => (shell.style.height = "auto"));
      await tween(800, (k) => { rev.style.clipPath = `inset(0 0 ${(1 - k) * 100}% 0)`; rev.style.transform = `translateY(${(1 - k) * -12}px)`; }, E.out, 150);
      bars.forEach((b, i) => tween(900, (k) => (b.style.transform = `scaleX(${k})`), E.out, i * 80));
    } else {
      const cur = shell.offsetHeight;
      tween(400, (k) => { rev.style.clipPath = `inset(0 0 ${k * 100}% 0)`; rev.style.transform = `translateY(${k * -12}px)`; }, E.inn);
      await tween(650, (k) => (shell.style.height = (1 - k) * cur + "px"), E.io, 120);
    }
    if (lenis) lenis.resize();
  }
  function animateLedgers(root) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target); const f = e.target; tween(1400, (k) => (f.style.transform = `scaleX(${k})`), E.out, 120); }), { rootMargin: "0px 0px -8% 0px" });
    $$(".row__fill", root).forEach((f) => { f.style.transform = "scaleX(0)"; io.observe(f); });
  }
  function sessionFrame(n) {
    const total = HR.nightMins(n); const maxMin = Math.max(...n.games.map((g) => g.mins));
    const rows = n.games.map((g) => `<div class="session__game"><div class="session__ghead"><p class="session__gtitle">${HR.game(g.id).name}</p><p class="session__gwin">${g.winners.join(", ") || "No winner"}</p><p class="session__gtime">${HR.fmtMins(g.mins)}</p></div><div class="session__bar"><i style="width:${(g.mins / maxMin) * 100}%"></i><b style="flex:1"></b></div></div>`).join("");
    const eve = new Date(n.date); eve.setDate(eve.getDate() - 1);
    return `<div class="session"><div class="session__content">
      <div class="session__left"><p class="session__meta">${HR.fmtLong(eve)}</p><p class="session__date">${HR.fmtDate(n.date)}</p><img class="session__sep" src="assets/img/separator-soft.svg" alt=""><p class="session__meta" style="font-size:var(--t-small)">${n.games.length} game${n.games.length > 1 ? "s" : ""} / ${HR.fmtMins(total)}</p><p class="session__players">${n.players.join(", ")}</p></div>
      <span class="session__divider"></span><div class="session__right">${rows}</div></div></div>`;
  }
  function animateSession(root) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target); $$(".session__bar i", e.target).forEach((b, i) => tween(1300, (k) => (b.style.transform = `scaleX(${k})`), E.out, 200 + i * 120)); }), { threshold: 0.3 });
    $$(".session", root).forEach((s) => { $$(".session__bar i", s).forEach((b) => (b.style.transform = "scaleX(0)")); io.observe(s); });
  }

  // ---------- game modal ----------
  let modalList = HR.GAMES, modalIdx = 0, modalOpen = false, modalBusy = false, modalCard = null;
  function gameFacts(g) {
    const nights = HR.NIGHTS.filter((n) => n.games.some((x) => x.id === g.id));
    const last = nights[nights.length - 1];
    const winsBy = {}; nights.forEach((n) => n.games.filter((x) => x.id === g.id).forEach((x) => x.winners.forEach((w) => (winsBy[w] = (winsBy[w] || 0) + 1))));
    const champ = Object.entries(winsBy).sort((a, b) => b[1] - a[1])[0];
    const mins = nights.reduce((a, n) => a + n.games.filter((x) => x.id === g.id).reduce((s, x) => s + x.mins, 0), 0);
    return { count: nights.length, last: last ? HR.fmtDate(last.date) : "Not yet", champ: champ ? champ[0] : "Unclaimed", mins };
  }
  function fillModal(g) {
    const M = $(".modal"); const f = gameFacts(g);
    $(".modal__plateimg img", M).src = `assets/img/${g.img}.jpg`; $(".modal__plateimg img", M).alt = g.name;
    $(".modal__medium", M).innerHTML = `<span>${g.genres.join(" / ")}</span><i class="diamond"></i><span>${g.players}</span>`;
    $(".modal__title", M).textContent = g.name;
    $(".modal__maker", M).textContent = g.maker;
    $(".modal__desc", M).textContent = g.desc;
    $(".modal__count", M).textContent = String(f.count).padStart(2, "0");
    $(".modal__ledger", M).innerHTML = `<div><dt>Last played</dt><dd>${f.last}</dd></div><div><dt>House champion</dt><dd class="accent">${f.champ}</dd></div><div><dt>Time at the table</dt><dd>${f.mins ? HR.fmtMins(f.mins) : "—"}</dd></div>`;
    const prev = modalList[(modalIdx - 1 + modalList.length) % modalList.length], next = modalList[(modalIdx + 1) % modalList.length];
    $(".modal__plink--prev .modal__ptitle", M).innerHTML = `<span data-roll>${prev.name}</span>`;
    $(".modal__plink--next .modal__ptitle", M).innerHTML = `<span data-roll>${next.name}</span>`;
    initRolls(M);
  }
  function setParts(k) { // k: 0 hidden → 1 shown (content parts)
    const M = $(".modal");
    $(".modal__title", M).style.transform = `translateY(${(1 - k) * 110}%)`;
    $(".modal__rule", M).style.transform = `scaleX(${k})`;
  }
  async function revealContent() {
    const M = $(".modal");
    const img = $(".modal__image", M), title = $(".modal__title", M), rule = $(".modal__rule", M), body = $(".modal__body", M), facts = $(".modal__facts", M), pager = $(".modal__pager", M), med = $(".modal__medium", M);
    tween(1000, (k) => (img.style.clipPath = `inset(${(1 - k) * 100}% 0 0 0)`), E.io);
    tween(500, (k) => (med.style.opacity = k), E.out, 150);
    tween(1000, (k) => (title.style.transform = `translateY(${(1 - k) * 110}%)`), E.out, 200);
    tween(1100, (k) => (rule.style.transform = `scaleX(${k})`), E.io, 300);
    [body, facts, pager].forEach((el, i) => tween(900, (k) => { el.style.clipPath = `inset(0 0 ${(1 - k) * 100}% 0)`; el.style.transform = `translateY(${(1 - k) * 16}px)`; }, E.out, 420 + i * 110));
    await wait(1200);
  }
  async function hideContent() {
    const M = $(".modal");
    const img = $(".modal__image", M), title = $(".modal__title", M), rule = $(".modal__rule", M), body = $(".modal__body", M), facts = $(".modal__facts", M), pager = $(".modal__pager", M), med = $(".modal__medium", M);
    tween(450, (k) => (title.style.transform = `translateY(${-k * 110}%)`), E.inn);
    tween(450, (k) => (rule.style.transform = `scaleX(${1 - k})`), E.inn);
    tween(300, (k) => (med.style.opacity = 1 - k), E.inn);
    [body, facts, pager].forEach((el) => tween(420, (k) => (el.style.clipPath = `inset(0 0 ${k * 100}% 0)`), E.inn));
    await tween(550, (k) => (img.style.clipPath = `inset(0 0 ${k * 100}% 0)`), E.io);
  }
  async function openModal(id, list, card) {
    if (modalBusy) return; modalBusy = true;
    modalList = list || HR.GAMES; modalIdx = Math.max(0, modalList.findIndex((g) => g.id === id)); modalCard = card;
    const M = $(".modal"); fillModal(modalList[modalIdx]);
    if (card) card.classList.add("is-active");
    M.classList.add("is-open"); modalOpen = true; lockScroll(true);
    const layers = $$(".modal__layer", M), bd = $(".modal__backdrop", M);
    hideStatic();
    tween(600, (k) => (bd.style.opacity = k), E.out);
    layers.forEach((l, i) => (l.style.transform = "translate(70%, 30%) rotate(12deg)"));
    await Promise.all(layers.map((l, i) => tween(1000, (k) => (l.style.transform = `translate(${(1 - k) * 70}%, ${(1 - k) * 30}%) rotate(${(1 - k) * 12}deg)`), E.io, i * 70)));
    $$(".modal__layer:not(.modal__panel)", M).forEach((l) => (l.style.visibility = "hidden"));
    await revealContent(); modalBusy = false;
    $(".modal__close", M).focus({ preventScroll: true });
  }
  function hideStatic() {
    const M = $(".modal");
    $(".modal__image", M).style.clipPath = "inset(100% 0 0 0)"; $(".modal__title", M).style.transform = "translateY(110%)"; $(".modal__rule", M).style.transform = "scaleX(0)"; $(".modal__medium", M).style.opacity = 0;
    $$(".modal__body,.modal__facts,.modal__pager", M).forEach((el) => (el.style.clipPath = "inset(0 0 100% 0)"));
    $$(".modal__layer", M).forEach((l) => (l.style.visibility = "visible"));
  }
  async function closeModal() {
    if (!modalOpen || modalBusy) return; modalBusy = true;
    const M = $(".modal"); const layers = $$(".modal__layer", M).reverse(), bd = $(".modal__backdrop", M);
    await hideContent();
    $$(".modal__layer", M).forEach((l) => (l.style.visibility = "visible"));
    tween(700, (k) => (bd.style.opacity = 1 - k), E.out, 300);
    await Promise.all(layers.map((l, i) => tween(900, (k) => (l.style.transform = `translate(${k * 80}%, ${k * 40}%) rotate(${k * 12}deg)`), E.io, i * 70)));
    M.classList.remove("is-open"); modalOpen = false; lockScroll(false); modalBusy = false;
    if (modalCard) { const c = modalCard; setTimeout(() => c.classList.remove("is-active"), 60); c.focus({ preventScroll: true }); }
  }
  async function stepModal(dir) {
    if (modalBusy) return; modalBusy = true;
    if (modalCard) modalCard.classList.remove("is-active");
    await hideContent();
    modalIdx = (modalIdx + dir + modalList.length) % modalList.length;
    fillModal(modalList[modalIdx]); hideStatic(); $$(".modal__layer:not(.modal__panel)").forEach((l) => (l.style.visibility = "hidden"));
    modalCard = document.querySelector(`.gcard[data-game="${modalList[modalIdx].id}"]`); if (modalCard) modalCard.classList.add("is-active");
    $(".modal__content").scrollTop = 0;
    await revealContent(); modalBusy = false;
  }
  function bindModal() {
    const M = $(".modal"); if (!M) return;
    $(".modal__close", M).addEventListener("click", closeModal);
    $(".modal__backdrop", M).addEventListener("click", closeModal);
    $(".modal__plink--prev", M).addEventListener("click", () => stepModal(-1));
    $(".modal__plink--next", M).addEventListener("click", () => stepModal(1));
    document.addEventListener("keydown", (e) => { if (!modalOpen) return; if (e.key === "Escape") closeModal(); if (e.key === "ArrowRight") stepModal(1); if (e.key === "ArrowLeft") stepModal(-1); });
    document.addEventListener("click", (e) => { const c = e.target.closest(".gcard[data-game]"); if (!c) return; const grid = c.closest("[data-list]"); const list = grid ? $$(".gcard[data-game]", grid).map((el) => HR.game(el.dataset.game)) : HR.GAMES; openModal(c.dataset.game, list, c); });
  }

  // ---------- footer: scaling table art + gilded brush reveal ----------
  function initFooter() {
    const F = $(".footer"); if (!F) return;
    const art = $(".footer__art", F); const cv = $("canvas", art);
    onScroll(() => { const r = F.getBoundingClientRect(); const p = clamp(1 - (r.top + r.height * 0.15) / innerHeight, 0, 1); art.style.transform = `scale(${0.82 + 0.18 * E.cubicOut(p)})`; });
    const gilded = new Image(); gilded.src = "assets/img/table-gilded.webp";
    const ctx = cv.getContext("2d"); const mask = document.createElement("canvas"); const mctx = mask.getContext("2d");
    let W = 0, H = 0, pts = [], live = false;
    const size = () => { const r = art.getBoundingClientRect(); W = cv.width = mask.width = Math.round(r.width); H = cv.height = mask.height = Math.round(r.height); };
    size(); addEventListener("resize", size);
    const toLocal = (e) => { const r = art.getBoundingClientRect(); const s = W / r.width; return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s }; };
    let last = null;
    const move = (e) => { const p = toLocal(e); if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) { last = null; return; }
      if (last) { const dx = p.x - last.x, dy = p.y - last.y, d = Math.hypot(dx, dy), n = Math.ceil(d / 6); for (let i = 1; i <= n; i++) pts.push({ x: last.x + (dx * i) / n, y: last.y + (dy * i) / n, life: 1 }); } else pts.push({ ...p, life: 1 });
      last = p; if (!live) { live = true; requestAnimationFrame(draw); } };
    F.addEventListener("pointermove", move); F.addEventListener("pointerleave", () => (last = null));
    function draw() {
      mctx.clearRect(0, 0, W, H);
      const r = W * 0.04;
      pts.forEach((p) => { p.life -= 0.014; const g = mctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(0,0,0,${Math.min(1, Math.max(0, p.life) * 1.4)})`); g.addColorStop(0.55, `rgba(0,0,0,${Math.min(1, Math.max(0, p.life) * 1.1)})`); g.addColorStop(1, "rgba(0,0,0,0)"); mctx.fillStyle = g; mctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); });
      pts = pts.filter((p) => p.life > 0);
      ctx.clearRect(0, 0, W, H);
      if (gilded.complete) { ctx.globalCompositeOperation = "source-over"; ctx.drawImage(gilded, 0, 0, W, H); ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = "source-over"; }
      if (pts.length) requestAnimationFrame(draw); else { live = false; ctx.clearRect(0, 0, W, H); }
    }
  }

  // ---------- svg defs (card clip) ----------
  function defs() {
    if ($("#hr-defs")) return;
    const d = document.createElement("div"); d.id = "hr-defs"; d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML = `<svg width="0" height="0"><defs><clipPath id="hr-card-clip" clipPathUnits="objectBoundingBox"><path d="M.06,0 H.94 A.06,.0475 0 0 0 1,.0475 V.9525 A.06,.0475 0 0 0 .94,1 H.06 A.06,.0475 0 0 0 0,.9525 V.0475 A.06,.0475 0 0 0 .06,0 Z"/></clipPath></defs></svg>`;
    document.body.appendChild(d);
  }
  const cardBorder = (color) => `<svg class="stat__border" viewBox="0 0 440 556" preserveAspectRatio="none" aria-hidden="true"><path d="M26.4,1.5 H413.6 A25,25 0 0 0 438.5,26.4 V529.6 A25,25 0 0 0 413.6,554.5 H26.4 A25,25 0 0 0 1.5,529.6 V26.4 A25,25 0 0 0 26.4,1.5 Z" fill="none" stroke="${color}" stroke-width="3" vector-effect="non-scaling-stroke"/><path d="M34,14 H406 A20,20 0 0 0 426,34 V522 A20,20 0 0 0 406,542 H34 A20,20 0 0 0 14,522 V34 A20,20 0 0 0 34,14 Z" fill="none" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;

  // ---------- boot ----------
  function boot() {
    defs(); initRolls(); bindNav(); bindLinks(); bindModal(); initFooter();
    // current page marker in menu
    const cur = pageName();
    $$(".menu__links a").forEach((a) => { if ((a.getAttribute("href") || "").replace(/\.html.*/, "") === cur) a.setAttribute("aria-current", "page"); });
    fitAll(); addEventListener("resize", fitAll); if (document.fonts) document.fonts.ready.then(() => { fitAll(); lenis && lenis.resize(); });
    window.dispatchEvent(new Event("hr:ready"));
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, wait(1500)]) : Promise.resolve();
    fontsReady.then(() => { initReveals(); prepIntro(); fitAll(); loader().then(runIntro); });
  }
  function prepIntro() {
    // generic page intros (titles, lede, aside) played once the loader/transition clears
    const intro = $$("[data-intro]");
    intro.forEach((el) => {
      const m = el.dataset.intro;
      if (m === "chars") splitChars(el).forEach((c) => (c.style.transform = "translateY(105%)"));
      if (m === "lines") splitLines(el).forEach((l) => (l.style.transform = "translateY(110%)"));
      if (m === "rule") el.style.transform = "scaleX(0)";
      if (m === "fade") el.style.opacity = 0;
    });
    fitAll();
    onIntro(() => intro.forEach((el, i) => {
      const m = el.dataset.intro;
      if (m === "chars") animIn($$(".c", el), { y: 105, stagger: 32, dur: 1200 });
      if (m === "lines") animIn($$(".ln > span", el), { stagger: 90, delay: 450 });
      if (m === "rule") { el.style.transformOrigin = "0 50%"; tween(1200, (k) => (el.style.transform = `scaleX(${k})`), E.io, 500); }
      if (m === "fade") $$(":scope > *, dl > div", el).forEach((c, j) => { c.style.opacity = 0; el.style.opacity = 1; tween(800, (k) => { c.style.opacity = k; c.style.transform = `translateY(${(1 - k) * 14}px)`; }, E.out, 600 + j * 70); });
    }));
  }

  window.HRX = { $, $$, E, tween, wait, clamp, lerp, reduce, fine, onScroll, lockScroll, splitChars, splitLines, animIn, initRolls, initReveals, fitAll, onIntro, gameCard, nightRow, bindRows, toggleRow, animateLedgers, sessionFrame, animateSession, openModal, cardBorder, href, get lenis() { return lenis; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
