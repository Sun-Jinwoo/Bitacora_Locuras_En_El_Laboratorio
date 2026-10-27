(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var A = (typeof anime !== "undefined" && !reduce) ? anime : null;
  var root = document.documentElement;

  // menú móvil
  var burger = $(".burger"), menu = $("#menu");
  if (burger && menu) burger.addEventListener("click", function () {
    var o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "✕" : "☰";
  });

  // progreso de lectura
  var bar = document.createElement("div"); bar.className = "progress"; document.body.prepend(bar);
  function sc() { var h = root; bar.style.transform = "scaleX(" + (h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1)) + ")"; }
  addEventListener("scroll", sc, { passive: true }); sc();

  // reloj de fase: tiñe todo el sitio
  var DUR = 15, t = DUR, phase = "amber", clk = $("#clk");
  function paint() {
    root.setAttribute("data-phase", phase);
    if (clk) clk.textContent = (phase === "amber" ? "ÁMBAR " : "AZUL ") + t + "s";
    calc();
  }
  function syncPhaseBtn() { $$("#sp button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-p") === phase ? "true" : "false"); }); }
  setInterval(function () { t--; if (t <= 0) { t = DUR; phase = phase === "amber" ? "blue" : "amber"; syncPhaseBtn(); } paint(); }, 1000);

  // calculadora de daño
  function sel(id) { return $("#" + id + " [aria-pressed='true']"); }
  function wire(id, cb) {
    var box = document.getElementById(id); if (!box) return;
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $$("button", box).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      if (cb) cb(b); calc();
    });
  }
  function calc() {
    var c = sel("sc"), e = sel("se"), g = sel("sg"); if (!c || !e || !g) return;
    var base = +c.getAttribute("data-d"), kind = c.getAttribute("data-t"), en = e.getAttribute("data-e");
    var weak = (en === "sal" && kind === "cor") || (en === "cal" && kind === "cold");
    var ty = weak ? 2 : 0.5, ph = kind === "cor" ? (phase === "amber" ? 1.5 : 0.7) : (phase === "blue" ? 1.5 : 0.7);
    var gm = g.getAttribute("data-g") === "1" ? 3 : 1, d = Math.round(base * ty * ph * gm), m = ty * ph * gm;
    $("#dmg").textContent = d; $("#bm").style.width = Math.min(100, d / 1.9) + "%";
    $("#eq").textContent = base + " base × " + ty + " tipo × " + ph + " fase" + (gm > 1 ? " × 3 guardián" : "") + " = " + d;
    $("#vd").textContent = m >= 1.5 ? "¡Eficaz!" : (m <= 0.6 ? "Resiste" : "Normal");
  }
  wire("sc"); wire("se"); wire("sg"); wire("sp", function (b) { phase = b.getAttribute("data-p"); });
  syncPhaseBtn(); paint();

  // pestañas
  $$(".tablist").forEach(function (tl) {
    var tabs = $$("[role=tab]", tl);
    tabs.forEach(function (tb) {
      tb.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", x === tb ? "true" : "false"); var p = document.getElementById(x.getAttribute("aria-controls")); if (p) p.hidden = x !== tb; });
        var p = document.getElementById(tb.getAttribute("aria-controls"));
        if (A && p) A({ targets: p.children, translateY: [16, 0], opacity: [0, 1], delay: A.stagger(80), duration: 400, easing: "easeOutQuad" });
      });
    });
  });

  // GDD
  function all(o) { $$("details").forEach(function (d) { d.open = o; }); }
  var oa = $("#open-all"), ca = $("#close-all");
  if (oa) oa.addEventListener("click", function () { all(true); });
  if (ca) ca.addEventListener("click", function () { all(false); });

  // pendientes recordados
  $$(".todo input").forEach(function (el) {
    try { el.checked = localStorage.getItem("cronos-" + el.id) === "1"; } catch (e) {}
    el.addEventListener("change", function () { try { localStorage.setItem("cronos-" + el.id, el.checked ? "1" : "0"); } catch (e) {} });
  });

  // contadores
  function count(el) {
    var n = +el.getAttribute("data-count"); if (!A) { el.textContent = n; return; }
    var o = { v: 0 }; A({ targets: o, v: n, round: 1, duration: 1100, easing: "easeOutExpo", update: function () { el.textContent = o.v; } });
  }
  $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });

  // aparición al hacer scroll (visible por defecto; solo se anima lo que está bajo la pantalla)
  if ("IntersectionObserver" in window && A) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target;
        if (el.hasAttribute("data-count")) { count(el); return; }
        A({ targets: el, translateY: [26, 0], opacity: [0, 1], duration: 520, easing: "easeOutCubic", complete: function () { el.style.transform = ""; el.style.opacity = ""; } });
      });
    }, { threshold: .12 });
    $$(".reveal, .card, .char, .fig, .step, .entry, .ev, details").forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.top > innerHeight) io.observe(el);
    });
    $$("[data-count]").forEach(function (el) { el.textContent = "0"; io.observe(el); });
  }

  // título del hero letra por letra
  var h1 = $(".hero h1");
  if (h1 && A) {
    $$(".t", h1).forEach(function (line) {
      var txt = line.textContent; line.setAttribute("aria-label", txt);
      line.innerHTML = txt.split(" ").map(function (w) { return '<span style="display:inline-block;white-space:nowrap" aria-hidden="true">' + w.split("").map(function (c) { return '<span class="ch" style="display:inline-block">' + c + "</span>"; }).join("") + "</span>"; }).join(" ");
    });
    A({ targets: ".hero h1 .ch", translateY: [36, 0], rotate: [6, 0], opacity: [0, 1], delay: A.stagger(24, { start: 100 }), duration: 520, easing: "easeOutBack" });
    A({ targets: [".hero .kicker", ".hero .lead", ".hero .tags li", ".hero .btn"], translateY: [18, 0], opacity: [0, 1], delay: A.stagger(70, { start: 500 }), duration: 450, easing: "easeOutQuad" });
  }
  var hero = $(".hero"), himg = hero && $("img", hero);
  if (hero && himg && !reduce) {
    addEventListener("scroll", function () { if (scrollY < innerHeight) himg.style.transform = "scale(1.06) translateY(" + (scrollY * .12) + "px)"; }, { passive: true });
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      himg.style.transform = "scale(1.08) translate(" + (-x * 22) + "px," + (-y * 12) + "px)"; himg.style.transition = "transform .25s ease-out";
    });
  }
})();
