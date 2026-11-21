/* ==========================================================================
   Holy Covenant Church: site behaviour.
   Settings live in js/config.js; nothing here should need editing.
   ========================================================================== */
(function () {
  "use strict";

  var cfg = window.HCC || {};
  var doc = document;
  var root = doc.documentElement;
  var fromFolder = location.protocol === "file:";

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function make(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Menu (phones and tablets) ---------- */
  var toggle = doc.querySelector(".nav-toggle");
  var nav = doc.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- Soft shadow under the header once the page scrolls ---------- */
  var header = doc.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.pageYOffset > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer year ---------- */
  var year = doc.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Email addresses are assembled here so they never sit in the page source ---------- */
  all("a[data-u]").forEach(function (a) {
    var addr = a.getAttribute("data-u") + "@" + a.getAttribute("data-d");
    a.href = "mailto:" + addr;
    if (a.hasAttribute("data-show")) a.textContent = addr;
  });

  /* ---------- Contact form: send without leaving the page ---------- */
  var contactForm = doc.getElementById("contact-form-el");
  if (contactForm && window.fetch && window.FormData) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = contactForm.querySelector(".form-status");
      var button = contactForm.querySelector("button");
      button.disabled = true;
      status.className = "form-status";
      status.textContent = "Sending...";
      fetch(contactForm.action, { method: "POST", body: new FormData(contactForm), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("form " + r.status); })
        .then(function () {
          contactForm.classList.add("sent");
          status.textContent = "Thanks for submitting!";
        })
        .catch(function () {
          button.disabled = false;
          status.className = "form-status bad";
          status.textContent = "Your message could not be sent. Please try again, or use the email address on this page.";
        });
    });
  }

  /* ---------- Documents: use the copy in /docs when it is there ---------- */
  if (!fromFolder && window.fetch) {
    all("a[data-local]").forEach(function (a) {
      fetch(a.getAttribute("data-local"), { method: "HEAD" })
        .then(function (r) { if (r.ok) a.href = a.getAttribute("data-local"); })
        .catch(function () {});
    });
  }

  /* ---------- Tab icon: borrow the old copy until images/favicon.png is saved ---------- */
  var icon = doc.querySelector('link[rel="icon"][data-fallback]');
  if (icon) {
    var probe = new Image();
    probe.onerror = function () { icon.href = icon.getAttribute("data-fallback"); };
    probe.src = icon.getAttribute("href");
  }

  /* ---------- Sections below the fold ease in as they are reached ---------- */
  var reveals = all(".reveal");
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reveals.length && !calm && "IntersectionObserver" in window) {
    var limit = (window.innerHeight || root.clientHeight) * 0.92;
    var below = reveals.filter(function (e) { return e.getBoundingClientRect().top > limit; });
    reveals.forEach(function (e) { if (below.indexOf(e) < 0) e.classList.add("in"); });
    root.classList.add("reveal-on");
    var watcher = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add("in"); watcher.unobserve(it.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    below.forEach(function (e) { watcher.observe(e); });
  }

  /* ==========================================================================
     The schedule sheet
     Every page reads it for the notice bar; the home page also reads the
     sermon rows. Columns are found by their header names, so they may be
     reordered in the sheet without breaking anything here.
     ========================================================================== */
  var hero = doc.getElementById("hero");          // home page only
  var noticeBox = doc.getElementById("notice");
  var CACHE_KEY = "hcc-sheet-v2";
  var painted = false;

  function parseCsv(text) {
    var rows = [], row = [], cell = "", quoted = false, i, c;
    text = String(text).replace(/^﻿/, "");
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (quoted) {
        if (c === '"') { if (text.charAt(i + 1) === '"') { cell += '"'; i++; } else quoted = false; }
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function toIso(s) {
    var m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(s || "");
    if (m) return m[3] + "-" + ("0" + m[1]).slice(-2) + "-" + ("0" + m[2]).slice(-2);
    m = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? m[1] + "-" + m[2] + "-" + m[3] : "";
  }

  function readSheet(text) {
    var out = { entries: [], notice: "" };
    var rows = parseCsv(text);
    if (rows.length < 2) return out;
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var iD = head.indexOf("date"), iS = head.indexOf("season"), iT = head.indexOf("text"),
        iP = head.indexOf("preacher"), iR = head.indexOf("preacherraw"),
        iI = head.indexOf("image"), iN = head.indexOf("notice");
    rows.slice(1).forEach(function (r) {
      if (iN >= 0 && !out.notice && r[iN] && r[iN].trim()) out.notice = r[iN].trim().slice(0, 300);
      if (iD < 0 || iT < 0) return;
      var iso = toIso(r[iD]);
      var txt = (r[iT] || "").trim();
      if (!iso || !txt || txt.charAt(0) === "#") return;
      out.entries.push({
        date: iso,
        season: iS < 0 ? "" : (r[iS] || "").trim(),
        text: txt,
        preacher: ((iP >= 0 && r[iP]) || (iR >= 0 && r[iR]) || "").trim(),
        image: iI < 0 ? "" : (r[iI] || "").trim()
      });
    });
    out.entries.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return out;
  }

  /* Today's date at the church, whatever the visitor's time zone. */
  function todayIso() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    }
  }
  function utc(iso) { var p = iso.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function monthDay(iso) {
    return new Date(utc(iso)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric" });
  }

  function showNotice(message) {
    if (!noticeBox) return;
    noticeBox.querySelector("p").textContent = message || "";
    noticeBox.hidden = !message;
  }

  /* Picture behind the home page box: the sheet's image, then the standard
     one, then the copy still held on the old site. */
  function setHeroImage(name) {
    var img = hero.querySelector("img");
    if (!img) return;
    var folder = cfg.seriesFolder || "series-images/";
    var chain = [];
    if (name) chain.push(folder + name);
    chain.push(folder + (cfg.defaultImage || "hcc.jpg"));
    if (hero.getAttribute("data-remote")) chain.push(hero.getAttribute("data-remote"));
    var i = 0;
    img.onload = function () { if ((img.getAttribute("src") || "").indexOf("data:") !== 0) img.classList.add("ready"); };
    img.onerror = function () { i++; if (i < chain.length) img.src = chain[i]; else img.onerror = null; };
    var showing = img.getAttribute("src") === chain[0] && img.complete && img.naturalWidth > 0;
    if (!showing) img.src = chain[0];
  }

  /* The first service dated today or later is "this week". It stays through
     Sunday and gives way to the next one as Monday begins. */
  function renderHome(entries) {
    var today = todayIso();
    var past = entries.filter(function (x) { return x.date < today; });
    var next = entries.filter(function (x) { return x.date >= today; });
    var now = next.filter(function (x) { return x.date === next[0].date; });
    var later = next.slice(now.length, now.length + (cfg.upcomingCount || 5));

    setHeroImage(now.length ? now[0].image : "");

    var weekBox = doc.getElementById("this-week");
    if (weekBox) {
      weekBox.textContent = "";
      now.forEach(function (x, i) {
        var p = make("p");
        p.appendChild(make("strong", "", (i === 0 ? "This Week" : (x.season || "Also")) + ": "));
        p.appendChild(doc.createTextNode(x.preacher
          ? x.preacher + " will preach on " + x.text + "."
          : "The sermon text is " + x.text + "."));
        weekBox.appendChild(p);
      });
      weekBox.hidden = !now.length;
      weekBox.classList.remove("waiting");
    }

    var lastBox = doc.getElementById("last-week");
    if (lastBox) {
      var last = null;
      if (past.length) {
        var lastDate = past[past.length - 1].date;
        last = past.filter(function (x) { return x.date === lastDate; })[0];
      }
      var recent = last && (utc(today) - utc(last.date)) / 864e5 <= 8;
      lastBox.textContent = recent && last.preacher ? "Missed last week's sermon by " + last.preacher + "?" : "";
    }

    var sched = doc.getElementById("schedule");
    if (sched) {
      var list = sched.querySelector(".upcoming");
      list.textContent = "";
      later.forEach(function (x) {
        var li = make("li");
        li.appendChild(make("span", "d", monthDay(x.date)));
        var t = make("span", "t", x.text);
        if (x.season && !/^ordinary/i.test(x.season)) t.appendChild(make("small", "", x.season));
        li.appendChild(t);
        li.appendChild(make("span", "p", x.preacher));
        list.appendChild(li);
      });
      sched.hidden = !later.length;
    }
  }

  function plainHome() {
    setHeroImage("");
    var weekBox = doc.getElementById("this-week");
    if (weekBox) weekBox.hidden = true;
  }
  function applySheet(data) {
    showNotice(data.notice);
    if (!hero) return;
    if (data.entries.length) { renderHome(data.entries); painted = true; }
    else if (!painted) plainHome();
  }
  function giveUp() {
    if (hero && !painted) plainHome();
  }

  /* A page opened straight from a folder cannot read the live sheet (browsers
     forbid it), so show the saved sample from config.js instead. */
  if (fromFolder) {
    if (cfg.previewCsv) {
      applySheet(readSheet(cfg.previewCsv));
      if (hero) doc.body.appendChild(make("div", "preview-note",
        "Preview from this computer: showing a saved sample of the schedule. The live sheet loads once the site is on the web."));
    } else giveUp();
    return;
  }

  /* Show the last copy this visitor saw at once, then refresh from the sheet. */
  if (hero) {
    try {
      var kept = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (kept && kept.entries && kept.entries.length && Date.now() - kept.t < 14 * 864e5) {
        renderHome(kept.entries); painted = true;
      }
    } catch (e) {}
  }

  if (!cfg.sheetCsvUrl || !window.fetch) { giveUp(); return; }

  var timer = setTimeout(giveUp, 2500);
  fetch(cfg.sheetCsvUrl, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("sheet " + r.status); return r.text(); })
    .then(function (text) {
      clearTimeout(timer);
      var data = readSheet(text);
      applySheet(data);
      if (data.entries.length) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), entries: data.entries })); } catch (e) {}
      }
    })
    .catch(function () { clearTimeout(timer); giveUp(); });
})();
