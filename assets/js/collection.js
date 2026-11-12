/* House Rules — collection page */
(function () {
  const HR = window.HR;
  window.addEventListener("hr:ready", () => {
    const X = window.HRX; const { $, $$, E, tween } = X;
    const games = HR.GAMES.slice().sort((a, b) => a.name.localeCompare(b.name));
    const PAGE = 12; let shown = Math.min(PAGE, games.length);
    const grid = $(".grid--all"), more = $(".coll__more");
    const filler = `<a class="filler" href="plays.html"><span class="filler__art"></span><span class="filler__count">Off the shelf</span><span class="filler__foot"><span class="filler__title">The play log</span><span class="filler__arrow">→</span></span></a>`;
    function render(from = 0) {
      grid.innerHTML = games.slice(0, shown).map((g, i) => X.gameCard(g, i % 5 === 4)).join("") + (shown >= games.length ? filler : "");
      grid.dataset.odd = String(shown % 2 === 1);
      more.hidden = shown >= games.length;
      $(".coll__morecount", more).textContent = `${shown} of ${games.length}`;
      const cards = $$(".gcard, .filler", grid).slice(from);
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target; tween(1100, (k) => { el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 40}px)`; }, E.out, (+el.dataset.i % 3) * 90); }), { rootMargin: "0px 0px -6% 0px" });
      cards.forEach((c, i) => { c.dataset.i = i; c.style.opacity = 0; io.observe(c); });
      X.lenis && X.lenis.resize();
    }
    render();
    more.addEventListener("click", async () => { more.disabled = true; await X.wait(600); const from = shown; shown = Math.min(shown + PAGE, games.length); render(from); more.disabled = false; });
  });
})();
