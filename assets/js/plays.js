/* House Rules — play log page: night ribbon, latest night, filterable record with pages */
(function () {
  const HR = window.HR;
  window.addEventListener("hr:ready", () => {
    const X = window.HRX; const { $, $$, E, tween, clamp } = X;
    const q = new URLSearchParams(location.search);
    const state = { year: q.get("year") || "", player: q.get("player") || "", game: q.get("game") || "", sort: q.get("sort") || "newest", page: Math.max(1, +q.get("page") || 1) };
    const PER = 10;

    // ================= RIBBON =================
    const nights = HR.NIGHTS; const ribbon = $(".ribbon"), axis = $(".axis"), scale = $(".chart__scale"), readout = $(".readout");
    const start = new Date(2026, 0, 1), end = new Date(2026, 9, 31); const span = end - start;
    const MAXH = 240; // 4h tall
    const xOf = (d) => ((d - start) / span) * 100;
    ribbon.style.setProperty("--slot", ribbon.clientWidth / 110 + "px");
    ribbon.innerHTML = [60, 120, 180].map((m) => `<span class="ribbon__grid" style="bottom:${(m / MAXH) * 100}%"></span>`).join("") + `<span class="ribbon__base"></span>` +
      nights.map((n) => `<span class="night" data-no="${n.no}" style="left:${xOf(n.date)}%"><span class="night__bar" style="height:${(HR.nightMins(n) / MAXH) * 100}%">${n.games.map((g) => `<i style="flex-grow:${g.mins}"></i>`).join("")}</span></span>`).join("") +
      `<span class="marker" style="opacity:0"><span class="marker__in"><span class="marker__diamond"></span><span class="marker__tag"><b></b><span></span></span></span></span>`;
    scale.innerHTML = [60, 120, 180].map((m) => `<span class="chart__mark" style="bottom:${(m / MAXH) * 100}%">${m / 60}h</span>`).join("");
    axis.innerHTML = HR.MONTHS.slice(0, 10).map((m, i) => `<span class="axis__m${i % 3 === 0 ? " q" : ""}" style="left:${xOf(new Date(2026, i, 1))}%">${m}${i === 0 ? "<b>2026</b>" : ""}</span>`).join("");
    const setSlot = () => ribbon.style.setProperty("--slot", ribbon.clientWidth / 110 + "px"); addEventListener("resize", setSlot);
    const bars = $$(".night__bar", ribbon); const grids = $$(".ribbon__grid, .ribbon__base", ribbon);
    bars.forEach((b) => (b.style.transform = "scaleY(0)")); grids.forEach((g) => (g.style.transform = "scaleX(0)"));
    const rio = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; rio.disconnect(); grids.forEach((g, i) => tween(1200, (k) => (g.style.transform = `scaleX(${k})`), E.io, i * 80)); bars.forEach((b, i) => tween(900, (k) => (b.style.transform = `scaleY(${k})`), E.out, 300 + i * 12)); }, { threshold: 0.3 });
    rio.observe(ribbon);
    const defaultReadout = readout.innerHTML; const marker = $(".marker", ribbon);
    let active = null;
    function activate(no) {
      const n = nights[no - 1]; if (!n) return; active = no; ribbon.dataset.active = no;
      $$(".night", ribbon).forEach((el) => el.classList.toggle("is-active", +el.dataset.no === no));
      const wins = HR.nightWinners(n);
      readout.innerHTML = `<p class="readout__line"><span class="readout__date" style="color:var(--blue)">${HR.fmtDate(n.date)}</span><span class="readout__games">${[...new Set(n.games.map((g) => HR.game(g.id).name))].join(", ")}</span></p>
        <p class="readout__meta"><span>Night ${String(n.no).padStart(2, "0")}</span><i class="diamond"></i><span>${HR.fmtMins(HR.nightMins(n))}</span><i class="diamond"></i><span>${n.players.length} at the table</span><i class="diamond"></i><span>${wins.length ? "Won by " + wins.join(", ") : "No winner recorded"}</span><span class="readout__hint"><span class="hint-pointer">Click to open it in the record</span><span class="hint-touch">Tap again to open it in the record</span></span></p>`;
      const x = xOf(n.date); marker.style.opacity = 1; marker.style.transform = `translate(${(x / 100) * ribbon.clientWidth}px, ${-(HR.nightMins(n) / MAXH) * ribbon.clientHeight}px)`;
      $(".marker__tag b", marker).textContent = HR.fmtShort(n.date); $(".marker__tag span", marker).textContent = HR.fmtMins(HR.nightMins(n));
      $(".marker__tag", marker).style.setProperty("--align", x < 8 ? "0%" : x > 92 ? "-100%" : "-50%");
    }
    function deactivate() { active = null; delete ribbon.dataset.active; $$(".night", ribbon).forEach((el) => el.classList.remove("is-active")); readout.innerHTML = defaultReadout; marker.style.opacity = 0; }
    const nearest = (clientX) => { const r = ribbon.getBoundingClientRect(); const px = ((clientX - r.left) / r.width) * 100; let best = null, bd = 1e9; nights.forEach((n) => { const d = Math.abs(xOf(n.date) - px); if (d < bd) { bd = d; best = n.no; } }); return best; };
    let touchArmed = null;
    ribbon.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") activate(nearest(e.clientX)); });
    ribbon.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") deactivate(); });
    ribbon.addEventListener("click", (e) => { const no = nearest(e.clientX); if (!X.fine && touchArmed !== no) { touchArmed = no; activate(no); return; } openNight(no); });
    ribbon.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); activate(clamp((active || nights.length) + (e.key === "ArrowRight" ? 1 : -1), 1, nights.length)); } if (e.key === "Enter" && active) openNight(active); });
    function openNight(no) {
      const list = sortList(nights.slice()); const idx = list.findIndex((n) => n.no === no); const page = Math.floor(idx / PER) + 1;
      if (page === state.page && !state.year && !state.player && !state.game) { focusNight(no); return; }
      const p = new URLSearchParams({ page, night: no }); if (state.sort !== "newest") p.set("sort", state.sort);
      const a = document.createElement("a"); a.href = "plays.html?" + p.toString(); a.setAttribute("href", "plays.html?" + p.toString()); a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
    }

    // ================= LATEST =================
    $(".latest").innerHTML = X.sessionFrame(nights[nights.length - 1]); X.animateSession($(".latest"));

    // ================= RECORD =================
    const rec = $(".record"), sentence = $(".sentence"), note = $(".record__note"), listEl = $(".record__list"), empty = $(".record__empty"), pag = $(".pagination");
    const players = HR.PLAYERS, gamesAZ = HR.GAMES.slice().sort((a, b) => a.name.localeCompare(b.name));
    const SORTS = { newest: "newest first", oldest: "oldest first", longest: "longest first", shortest: "shortest first" };
    function sortList(l) { const s = state.sort; if (s === "oldest") return l.sort((a, b) => a.no - b.no); if (s === "longest") return l.sort((a, b) => HR.nightMins(b) - HR.nightMins(a)); if (s === "shortest") return l.sort((a, b) => HR.nightMins(a) - HR.nightMins(b)); return l.sort((a, b) => b.no - a.no); }
    const match = (n, st = state) => (!st.year || String(n.date.getFullYear()) === st.year) && (!st.player || n.players.includes(st.player)) && (!st.game || n.games.some((g) => g.id === st.game));
    const filtered = () => sortList(nights.filter((n) => match(n)));
    const TOK = {
      year: { title: "Years on record", note: "1 year to choose from", any: "in any year", label: (v) => `in ${v}`, opts: () => [["", "Any year"], ["2026", "2026"]] },
      player: { title: "Who sat down", note: `${players.length} players to choose from`, any: "anyone", label: (v) => v, opts: () => [["", "Anyone"], ...players.map((p) => [p, p])] },
      game: { title: "What was played", note: `${HR.GAMES.length} games to choose from`, any: "any game", label: (v) => HR.game(v).name, opts: () => [["", "Any game"], ...gamesAZ.map((g) => [g.id, g.name])] },
      sort: { title: "In what order", note: "4 ways to read the record", any: "newest first", label: (v) => SORTS[v], opts: () => Object.entries(SORTS).map(([k, v]) => [k, v[0].toUpperCase() + v.slice(1)]) },
    };
    const tok = (k) => { const v = state[k]; const set = k === "sort" ? v !== "newest" : !!v; return `<button class="token${set ? " is-set" : ""}" type="button" data-tok="${k}" aria-haspopup="true" aria-expanded="false">${set ? TOK[k].label(v) : TOK[k].any}</button>`; };
    function renderSentence() { sentence.innerHTML = `Every night ${tok("year")}, with ${tok("player")} at the table, playing ${tok("game")}, ${tok("sort")}.`; }
    let drawer = null, openTok = null;
    function closeDrawer() { if (!drawer) return; const d = drawer; drawer = null; openTok && openTok.classList.remove("is-open"); openTok && openTok.setAttribute("aria-expanded", "false"); openTok = null; delete rec.dataset.filtering; tween(380, (k) => (d.style.clipPath = `inset(-16px 0 ${k * 100}% 0)`), E.inn).then(() => d.remove()); }
    function openDrawer(btn) {
      const k = btn.dataset.tok; if (openTok === btn) { closeDrawer(); return; }
      const reuse = !!drawer; if (drawer) { drawer.remove(); drawer = null; openTok && openTok.classList.remove("is-open"); }
      openTok = btn; btn.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); rec.dataset.filtering = "";
      const T = TOK[k]; const cur = state[k];
      const count = (v) => nights.filter((n) => match(n, { ...state, [k]: k === "sort" ? state.sort : v })).length;
      const opts = T.opts().map(([v, l]) => { const c = k === "sort" ? null : count(v); const off = c === 0; return `<li class="drawer__opt${v === cur ? " is-sel" : ""}${off ? " is-off" : ""}"><a class="drawer__link" href="#" data-v="${v}" ${off ? 'aria-disabled="true"' : ""}><span class="drawer__label"><span data-roll>${l}</span></span>${c != null ? `<span class="drawer__count">${c} nights</span>` : ""}</a></li>`; }).join("");
      drawer = document.createElement("div"); drawer.className = "drawer"; drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-label", T.title);
      drawer.innerHTML = `<div class="drawer__head"><p class="drawer__title">${T.title}</p><p class="drawer__note">${T.note}</p><button class="drawer__close" type="button"><span data-roll>Close</span><span class="drawer__x"></span></button></div><ul class="drawer__opts">${opts}</ul>`;
      $(".record__head").appendChild(drawer); X.initRolls(drawer);
      const hb = $(".record__head").getBoundingClientRect(), bb = btn.getBoundingClientRect(); drawer.style.setProperty("--notch", bb.left - hb.left + Math.min(bb.width / 2, 48) + "px");
      drawer.style.clipPath = "inset(-16px 0 100% 0)"; tween(reuse ? 380 : 600, (kk) => (drawer.style.clipPath = `inset(-16px 0 ${(1 - kk) * 100}% 0)`), E.out);
      $(".drawer__close", drawer).addEventListener("click", closeDrawer);
      $$(".drawer__link", drawer).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); if (a.getAttribute("aria-disabled")) return; state[k] = a.dataset.v; state.page = 1; closeDrawer(); apply(); }));
    }
    sentence.addEventListener("click", (e) => { const b = e.target.closest(".token"); if (b) openDrawer(b); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    document.addEventListener("click", (e) => { if (drawer && !e.target.closest(".drawer,.token")) closeDrawer(); });
    $(".record__reset").addEventListener("click", () => { Object.assign(state, { year: "", player: "", game: "", sort: "newest", page: 1 }); apply(); });

    function qs(extra = {}) { const o = { ...state, ...extra }; const p = new URLSearchParams(); ["year", "player", "game"].forEach((k) => o[k] && p.set(k, o[k])); if (o.sort !== "newest") p.set("sort", o.sort); if (o.page > 1) p.set("page", o.page); const s = p.toString(); return "plays.html" + (s ? "?" + s : ""); }
    function renderList(animate) {
      const list = filtered(); const pages = Math.max(1, Math.ceil(list.length / PER)); state.page = Math.min(state.page, pages);
      const slice = list.slice((state.page - 1) * PER, state.page * PER);
      listEl.innerHTML = slice.map((n) => X.nightRow(n)).join(""); X.bindRows(listEl); X.animateLedgers(listEl);
      empty.hidden = list.length > 0; $(".cols", rec).hidden = !list.length;
      $(".t-nights").textContent = list.length; $(".t-time").textContent = (() => { const m = list.reduce((a, n) => a + HR.nightMins(n), 0); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`; })(); $(".t-page").textContent = `${state.page} of ${pages}`;
      const filteredOn = state.year || state.player || state.game;
      note.hidden = !filteredOn; note.innerHTML = filteredOn ? `<span>${list.length} of ${nights.length} nights match.</span><a class="arrow-link record__clear" href="plays.html"><span data-roll>Show every night</span> <span class="arr">→</span></a>` : "";
      // pagination: 01 02 03 04 · last
      const nums = []; for (let i = 1; i <= pages; i++) if (i <= 4 || i === pages || Math.abs(i - state.page) <= 1) nums.push(i);
      let pl = ""; nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) pl += `<li class="pagination__gap"><i></i></li>`; pl += `<li><a class="pg${n === state.page ? " is-cur" : ""}" href="${qs({ page: n })}" ${n === state.page ? 'aria-current="page"' : ""}><span data-roll>${String(n).padStart(2, "0")}</span></a></li>`; });
      const from = list.length ? (state.page - 1) * PER + 1 : 0, to = Math.min(state.page * PER, list.length);
      pag.innerHTML = list.length ? `<div class="pagination__step">${state.page > 1 ? `<a class="arrow-link" href="${qs({ page: state.page - 1 })}"><span class="arr arr--back">←</span> <span data-roll>Newer nights</span></a>` : `<span class="idle">← Newer nights</span>`}</div>
        <div class="pagination__pages"><ul class="pagination__list">${pl}</ul><p class="pagination__range">Nights ${from}–${to} of ${list.length}</p></div>
        <div class="pagination__step pagination__step--next">${state.page < pages ? `<a class="arrow-link" href="${qs({ page: state.page + 1 })}"><span data-roll>Older nights</span> <span class="arr">→</span></a>` : `<span class="idle">Older nights →</span>`}</div>` : "";
      X.initRolls(rec);
      if (animate) $$(".entry", listEl).forEach((en, i) => { en.style.opacity = 0; tween(700, (k) => { en.style.opacity = k; en.style.transform = `translateY(${(1 - k) * 18}px)`; }, E.out, i * 50); });
      X.lenis && X.lenis.resize();
    }
    async function apply() {
      renderSentence(); history.replaceState(null, "", qs());
      rec.dataset.filtering = ""; await X.wait(260); renderList(true); delete rec.dataset.filtering;
    }
    renderSentence(); renderList(false);

    function focusNight(no) {
      const en = $(`.entry[data-night="${no}"]`, listEl); if (!en) return;
      const y = en.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3;
      X.lenis ? X.lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: "smooth" });
      setTimeout(() => X.toggleRow(en, true), 900);
    }
    const target = +q.get("night"); if (target) X.onIntro(() => setTimeout(() => focusNight(target), 400));
  });
})();
