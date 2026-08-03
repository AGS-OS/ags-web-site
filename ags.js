/* ══════════════════════════════════════════════════════════════════════
   AGS — behaviour v3
   ART DIRECTION PASS

   The Spark is no longer an element that follows the cursor. It is light
   drawn additively on a canvas: a filament with a bright head, a tail
   that stretches when the hand accelerates and retracts when it stops,
   and a residue almost too faint to notice.

   Systems: 1 the Spark · 2 the air · 3 depth · 4 the rooms · 5 sound
   Everything degrades to a readable document.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var REDUCE = mqReduce.matches;

  var lerp = function (a, b, n) { return a + (b - a) * n; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var dpr = function () { return Math.min(window.devicePixelRatio || 1, 2); };

  /* ════ 1 · THE SPARK ═══════════════════════════════════════════════ */
  var canvas = document.getElementById("spark");
  var lamp = document.querySelector(".cursor-lamp");
  var word = document.querySelector(".spark-word");
  var sparkOn = false;
  var ctx = null;
  var pointer = { x: -200, y: -200 };
  var head = { x: -200, y: -200 };
  var prev = { x: -200, y: -200 };
  var history = [];
  var TRAIL_MAX = 22;
  var trailLen = 4;
  var intensity = 0;        // fades in when she is awake
  var lastMove = 0;
  var state = "idle";       // idle · open · read

  function sizeSpark() {
    if (!canvas) return;
    var r = dpr();
    canvas.width = Math.round(window.innerWidth * r);
    canvas.height = Math.round(window.innerHeight * r);
    ctx = canvas.getContext("2d");
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }

  function sparkEnable() {
    if (sparkOn || !canvas || REDUCE || !mqFine.matches) return;
    sparkOn = true;
    sizeSpark();
    doc.classList.add("spark-on");
    if (canvas) canvas.style.mixBlendMode = document.body.classList.contains("is-dark-room") ? "screen" : "normal";
  }
  function sparkDisable() {
    if (!sparkOn) return;
    sparkOn = false;
    doc.classList.remove("spark-on");
    if (word) word.classList.remove("is-shown");
    if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  if (canvas) {
    /* She begins where the thread is, and leaves it when a hand arrives. */
    var node = document.querySelector(".thread-node");
    if (node) {
      var nb = node.getBoundingClientRect();
      pointer.x = head.x = prev.x = nb.left + nb.width / 2;
      pointer.y = head.y = prev.y = nb.top + nb.height / 2;
    }

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      lastMove = performance.now();
      sparkEnable();

      var el = e.target instanceof Element ? e.target : null;
      var openable = el && el.closest("a, button, [role='button']");
      var namable = el && el.closest(".door, .handle, .contact");
      var reading = el && el.closest("[data-chispa='read']");

      if (openable) {
        state = "open";
        if (!namable && word) word.classList.remove("is-shown");
        if (word) {
          var w = openable.getAttribute("data-chispa-word");
          if (w) {
            if (word.textContent !== w) word.textContent = w;
            word.classList.add("is-shown");
          } else word.classList.remove("is-shown");
        }
      } else {
        state = reading ? "read" : "idle";
        if (word) word.classList.remove("is-shown");
      }
    }, { passive: true });

    window.addEventListener("keydown", function (e) { if (e.key === "Tab") sparkDisable(); });
    window.addEventListener("blur", sparkDisable);
    window.addEventListener("resize", function () { if (sparkOn) sizeSpark(); }, { passive: true });
    if (mqFine.addEventListener) {
      mqFine.addEventListener("change", function (e) { if (!e.matches) sparkDisable(); });
    }
  }

  function drawSpark(now) {
    if (!sparkOn || !ctx) return;
    var W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    /* the lamp the visitor carries: two custom properties, once a frame */
    if (lamp) {
      lamp.style.setProperty("--px", (head.x / W * 100).toFixed(2) + "%");
      lamp.style.setProperty("--py", (head.y / H * 100).toFixed(2) + "%");
    }

    prev.x = head.x; prev.y = head.y;
    head.x = lerp(head.x, pointer.x, 0.36);   // precise: she is still a cursor
    head.y = lerp(head.y, pointer.y, 0.36);

    var vx = head.x - prev.x, vy = head.y - prev.y;
    var speed = Math.sqrt(vx * vx + vy * vy);
    var idle = now - lastMove > 620;

    /* the tail stretches with acceleration and retracts when the hand stops */
    var want = idle ? 4 : clamp(5 + speed * 1.0, 5, TRAIL_MAX);
    trailLen = lerp(trailLen, want, speed > 1 ? 0.3 : 0.08);

    intensity = lerp(intensity, idle ? 0.52 : 1, 0.05);
    if (state === "read") intensity = lerp(intensity, 0.4, 0.12);

    history.unshift({ x: head.x, y: head.y });
    if (history.length > TRAIL_MAX + 2) history.pop();

    /* In a dark room the light adds itself. On ivory walls added light is
       invisible, so there it becomes a warm, low-opacity presence instead. */
    var bright = !document.body.classList.contains("is-dark-room");
    ctx.globalCompositeOperation = bright ? "source-over" : "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /* the filament */
    var n = Math.min(Math.round(trailLen), history.length - 1);
    for (var i = 1; i <= n; i++) {
      var t = i / n;
      var a = Math.pow(1 - t, 1.7) * 0.34 * intensity;
      if (a <= 0.002) continue;
      ctx.strokeStyle = bright
        ? "rgba(" + Math.round(196 - t * 20) + "," + Math.round(146 - t * 18) + "," + Math.round(58 + t * 10) + "," + (a * 1.5).toFixed(3) + ")"
        : "rgba(255," + Math.round(214 - t * 26) + "," + Math.round(150 - t * 40) + "," + a.toFixed(3) + ")";
      ctx.lineWidth = (1 - t) * 1.7 + 0.18;
      ctx.beginPath();
      ctx.moveTo(history[i - 1].x, history[i - 1].y);
      ctx.lineTo(history[i].x, history[i].y);
      ctx.stroke();
    }

    /* the head: a small core inside a soft glow, elongated while moving */
    var grow = state === "open" ? 1.5 : 1;
    var stretch = clamp(1 + speed * 0.045, 1, 1.9);
    var ang = Math.atan2(vy, vx);

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(ang);
    ctx.scale(stretch, 1 / (1 + (stretch - 1) * 0.35));
    var R = 13 * grow;
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    glow.addColorStop(0, "rgba(255,247,234," + (0.5 * intensity).toFixed(3) + ")");
    glow.addColorStop(0.28, "rgba(255,217,163," + (0.26 * intensity).toFixed(3) + ")");
    glow.addColorStop(1, "rgba(255,217,163,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    var cr = (state === "open" ? 2.1 : 1.5);
    var core = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, cr * 2.4);
    core.addColorStop(0, "rgba(255,252,246," + (0.92 * intensity).toFixed(3) + ")");
    core.addColorStop(0.5, "rgba(255,231,190," + (0.5 * intensity).toFixed(3) + ")");
    core.addColorStop(1, "rgba(255,217,163,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(head.x, head.y, cr * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";

    if (word) word.style.transform = "translate3d(" + (head.x + 15).toFixed(1) + "px," + (head.y + 9).toFixed(1) + "px,0)";
  }

  /* touch: one spark answers the finger, then goes */
  if (!mqFine.matches && !REDUCE) {
    window.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      var s = document.createElement("span");
      s.className = "tap-spark";
      s.style.left = e.clientX + "px";
      s.style.top = e.clientY + "px";
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 950);
      var door = e.target instanceof Element ? e.target.closest(".door") : null;
      if (door) {
        door.classList.add("is-touched");
        setTimeout(function () { door.classList.remove("is-touched"); }, 1600);
      }
    }, { passive: true });
  }

  /* ════ 2 · THE AIR — dust in every room that has a beam ════════════ */
  var airs = [];
  if (!REDUCE) {
    Array.prototype.forEach.call(document.querySelectorAll(".motes"), function (cv) {
      if (!cv.getContext) return;
      var air = { cv: cv, ctx: cv.getContext("2d"), dots: [], w: 0, h: 0, visible: false };
      air.size = function () {
        var r = cv.getBoundingClientRect(), d = dpr();
        air.w = r.width; air.h = r.height;
        if (!air.w || !air.h) return;
        cv.width = Math.round(air.w * d);
        cv.height = Math.round(air.h * d);
        air.ctx.setTransform(d, 0, 0, d, 0, 0);
        var n = air.w < 700 ? 11 : 22;
        air.dots = [];
        for (var i = 0; i < n; i++) {
          air.dots.push({
            x: Math.random() * air.w, y: Math.random() * air.h,
            r: 0.5 + Math.random() * 1.6,
            a: 0.05 + Math.random() * 0.24,
            vy: -0.035 - Math.random() * 0.1,
            vx: (Math.random() - 0.5) * 0.05,
            ph: Math.random() * 6.28
          });
        }
      };
      air.size();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (e) { air.visible = e[0].isIntersecting; }).observe(cv);
      } else air.visible = true;
      airs.push(air);
    });
    window.addEventListener("resize", function () {
      airs.forEach(function (a) { a.size(); });
    }, { passive: true });
  }

  function drawAir(now) {
    for (var k = 0; k < airs.length; k++) {
      var a = airs[k];
      if (!a.visible || !a.w) continue;
      a.ctx.clearRect(0, 0, a.w, a.h);
      a.ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < a.dots.length; i++) {
        var d = a.dots[i];
        d.y += d.vy; d.x += d.vx;
        if (d.y < -8) { d.y = a.h + 8; d.x = Math.random() * a.w; }
        if (d.x < -8) d.x = a.w + 8;
        if (d.x > a.w + 8) d.x = -8;
        /* each mote breathes on its own clock: nothing pulses together */
        var tw = 0.65 + 0.35 * Math.sin(now / 2600 + d.ph);
        var R = d.r * 4.2;
        var g = a.ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, R);
        g.addColorStop(0, "rgba(255,238,206," + (d.a * tw).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,238,206,0)");
        a.ctx.fillStyle = g;
        a.ctx.beginPath();
        a.ctx.arc(d.x, d.y, R, 0, Math.PI * 2);
        a.ctx.fill();
      }
      a.ctx.globalCompositeOperation = "source-over";
    }
  }

  /* ════ 3 · DEPTH ═══════════════════════════════════════════════════ */
  var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));
  var trace = document.querySelector(".thread-trace");
  var threadNode = document.querySelector(".thread-node");
  var masthead = document.querySelector(".masthead");
  var themed = document.querySelectorAll("[data-header]");
  var onDarkFallback = false;
  var darkRooms = Array.prototype.slice.call(
    document.querySelectorAll(".threshold, .light-void, .light-theatre, .room-dark, .foot, .night-room"));
  var vh = window.innerHeight;
  var ticking = false;

  /* ════ 3b · THE HOUSE LIGHTS ═══════════════════════════════════════
     The only sequence on the site. Between the last act and the law the
     room darkens — at exactly the speed the visitor scrolls, never on a
     timer. It cannot run on its own, and it cannot be missed. It lifts
     again once the law has been read, so no room is ever left dark.   */
  var fallLayer = document.querySelector(".housefall");
  var fallFrom = document.querySelector('[data-fall="from"]');
  var fallTo = document.querySelector('[data-fall="to"]');
  var falling = false;

  function houseLights() {
    if (!fallLayer || !fallFrom || !fallTo || REDUCE) return;
    var b = fallTo.getBoundingClientRect();
    /* A pulse centred on the seam between the two rooms: the light drains
       as the last act leaves, reaches its deepest exactly at the threshold
       of the law, and lifts again as the first line arrives out of it.
       It never becomes a wall — the law is always readable through it.   */
    var seam = b.top;
    var u = 1 - Math.abs(seam - vh * 0.34) / (vh * 0.8);
    u = clamp(u, 0, 1);
    var eased = u * u * (3 - 2 * u) * 0.9;
    fallLayer.style.opacity = eased.toFixed(3);
    var now = eased > 0.06;
    if (now !== falling) { falling = now; doc.classList.toggle("is-falling", falling); }
  }

  function paint() {
    ticking = false;
    var y = window.pageYOffset;
    var scrollable = doc.scrollHeight - vh;
    var progress = scrollable > 0 ? clamp(y / scrollable, 0, 1) : 0;

    if (!REDUCE) {
      for (var i = 0; i < scenes.length; i++) {
        var s = scenes[i];
        var b = s.getBoundingClientRect();
        if (b.bottom < -140 || b.top > vh + 140) continue;
        var vy = ((b.top + b.height / 2) - vh / 2) / (vh / 2 + b.height / 2);
        s.style.setProperty("--vy", clamp(vy, -1.4, 1.4).toFixed(4));
      }
    }

    if (trace) trace.style.height = (progress * 100).toFixed(2) + "%";
    if (threadNode) threadNode.style.transform = "translateY(" + (progress * (vh - 8)).toFixed(1) + "px)";

    if (masthead) {
      masthead.classList.toggle("is-settled", y > 40);
      /* The header reads the room it stands in. Each section declares its own
         theme, so a bright sky never gets ivory type laid over it. */
      var probe = masthead.offsetHeight * 0.6, theme = "";
      for (var t2 = 0; t2 < themed.length; t2++) {
        var tb = themed[t2].getBoundingClientRect();
        if (tb.top <= probe && tb.bottom >= probe) { theme = themed[t2].getAttribute("data-header"); }
      }
      if (!theme) {
        var onDark = false;
        for (var j = 0; j < darkRooms.length; j++) {
          var rb = darkRooms[j].getBoundingClientRect();
          if (rb.top <= probe && rb.bottom >= probe) { onDark = true; break; }
        }
        theme = onDark ? "dark" : "light";
      }
      masthead.classList.toggle("on-dark", theme === "dark");
      masthead.classList.toggle("on-light", theme !== "dark");
    }

    houseLights();
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paint);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; onScroll(); }, { passive: true });
  window.addEventListener("orientationchange", function () { vh = window.innerHeight; onScroll(); });
  paint();

  /* one loop for the light and the air */
  function loop(now) {
    drawSpark(now);
    drawAir(now);
    window.requestAnimationFrame(loop);
  }
  if (!REDUCE) window.requestAnimationFrame(loop);

  /* ════ 4 · THE ROOMS ═══════════════════════════════════════════════ */
  var risers = document.querySelectorAll(".rise");
  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(risers, function (el) { el.classList.add("is-in"); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        if (e.target.classList.contains("method")) cue("resonance");
        if (e.target.hasAttribute("data-cue")) cue(e.target.getAttribute("data-cue"));
        seen.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    Array.prototype.forEach.call(risers, function (el) { seen.observe(el); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cue]"), function (el) { seen.observe(el); });
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
    };
    toggle.addEventListener("click", function () { setOpen(nav.getAttribute("data-open") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") { setOpen(false); toggle.focus(); }
    });
  }

  /* ════ 5 · SOUND — off until someone asks ══════════════════════════ */
  var audio = null, master = null, soundOn = false, lastChime = 0;
  var soundBtn = document.querySelector(".util-sound");

  function ensureAudio() {
    if (audio) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    audio = new AC();
    master = audio.createGain();
    master.gain.value = 0.5;
    master.connect(audio.destination);
    return true;
  }
  function cue(kind) {
    if (!soundOn || !audio) return;
    var t = audio.currentTime;
    if (kind === "breath") {
      var len = 3.6, buf = audio.createBuffer(1, Math.floor(audio.sampleRate * len), audio.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      var src = audio.createBufferSource(); src.buffer = buf;
      var bp = audio.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 290; bp.Q.value = 1.1;
      var g = audio.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 1.6);
      g.gain.linearRampToValueAtTime(0.0001, t + len);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + len);
    } else if (kind === "resonance") {
      [196, 294].forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.028 - i * 0.01, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 2.7);
      });
    } else if (kind === "chime") {
      if (t - lastChime < 0.45) return;
      lastChime = t;
      [660, 990].forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.02 - i * 0.008, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 1);
      });
    }
  }

  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      if (!soundOn) {
        if (!ensureAudio()) { soundBtn.disabled = true; return; }
        if (audio.state === "suspended") audio.resume();
        soundOn = true;
        soundBtn.setAttribute("aria-pressed", "true");
        soundBtn.querySelector(".util-state").textContent = "on";
        cue("chime");
      } else {
        soundOn = false;
        soundBtn.setAttribute("aria-pressed", "false");
        soundBtn.querySelector(".util-state").textContent = "off";
      }
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".door, .handle"), function (d) {
    d.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") cue("chime"); });
  });
})();

/* ══════════════════════════════════════════════════════════════════════
   AGS — language
   Three editions, not one site with translations. On a first visit the
   browser's own language decides which door opens; after that the
   visitor's choice is remembered and never asked for again.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var KEY = "ags-lang";
  var HERE = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
  var store = {
    get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  };

  /* an explicit choice is remembered, and followed from then on */
  Array.prototype.forEach.call(document.querySelectorAll("[data-set-lang]"), function (a) {
    a.addEventListener("click", function () { store.set(a.getAttribute("data-set-lang")); });
  });
  var current = document.querySelector('.lang[aria-current="true"]');
  if (current) current.addEventListener("click", function () { store.set(HERE); });

  /* first visit only, and only from the English edition */
  if (HERE !== "en") { store.set(HERE); return; }
  var known = store.get();
  var want = known;
  if (!want) {
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    nav = nav.toLowerCase().slice(0, 2);
    want = (nav === "fr" || nav === "es") ? nav : "en";
    store.set(want);
  }
  if (want === "en" || want === HERE) return;
  var target = document.querySelector('.lang[data-set-lang="' + want + '"]');
  if (target && target.getAttribute("href")) {
    location.replace(target.getAttribute("href"));
  }
})();


/* ══════════════════════════════════════════════════════════════════════
   AGS — the enquiry
   No server, no third party, nothing stored: the form composes a letter
   and hands it to the visitor's own email application. Without
   JavaScript the address below the form still works.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var form = document.getElementById("enquiry");
  if (!form) return;
  var ADDRESS = "info@agsproduction.fr";   /* CONFIG · email */

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var need = ["name", "institution", "country", "email", "message"], missing = null;
    need.forEach(function (n) {
      var el = form.elements[n];
      var wrap = el.closest(".field");
      var empty = !el.value.trim();
      if (wrap) wrap.classList.toggle("is-missing", empty);
      if (empty && !missing) missing = el;
    });
    if (missing) { missing.focus(); return; }

    var v = function (n) { return (form.elements[n].value || "").trim(); };
    var subject = "Working with AGS — " + v("institution") + " (" + v("country") + ")";
    var body = [
      v("message"), "", "—",
      "Name: " + v("name"),
      "Institution: " + v("institution"),
      "Country: " + v("country"),
      "Email: " + v("email"),
      v("phone") ? "Phone: " + v("phone") : ""
    ].filter(Boolean).join("\n");

    window.location.href = "mailto:" + ADDRESS +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  });
})();
