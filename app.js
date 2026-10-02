/* ============================================================
   app.js — Smile & Glow Front Desk
   Two surfaces on one codebase:
     · the patient booking flow (embeds on smileandglow.com)
     · the staff dashboard (runs the clinic)
   ============================================================ */

(function () {
  "use strict";

  var S = window.Store;
  var U = S.util;
  var C = S.clinic;

  /* ---------- tiny helpers ---------------------------------------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n) {
    if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L";
    if (n >= 1000) return "₹" + Math.round(n / 1000) + "k";
    return "₹" + n;
  }
  function initials(name) {
    var p = String(name).trim().split(/\s+/);
    return ((p[0] || "")[0] + (p[1] ? p[1][0] : "")).toUpperCase();
  }
  function dayName(dISO, long) {
    var d = U.parseISO(dISO);
    var s = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
    return long ? s : s.slice(0, 3);
  }
  function monName(dISO) {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][U.parseISO(dISO).getMonth()];
  }
  function niceDate(dISO) {
    var t = U.iso(S.today());
    if (dISO === t) return "Today";
    if (dISO === U.iso(U.addDays(S.today(), 1))) return "Tomorrow";
    if (dISO === U.iso(U.addDays(S.today(), -1))) return "Yesterday";
    var d = U.parseISO(dISO);
    return dayName(dISO) + ", " + d.getDate() + " " + monName(dISO);
  }
  function gapWords(days) {
    if (days >= 365) return Math.floor(days / 365) + (days >= 730 ? " years" : " year");
    if (days >= 30) return Math.floor(days / 30) + (days >= 60 ? " months" : " month");
    if (days >= 14) return Math.floor(days / 7) + " weeks";
    return days + (days === 1 ? " day" : " days");
  }

  /* ---------- icons ------------------------------------------------ */

  var P = {
    home:     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users:    '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.4-3.6 3.2-5.6 6.5-5.6s6.1 2 6.5 5.6"/><path d="M16.5 5.6a3.2 3.2 0 0 1 0 6.3M18 14.8c2.2.6 3.4 2.4 3.6 5.2"/>',
    bell:     '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    chart:    '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.95-1.15l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3 14.5a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.25 7.5l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 10 3.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.95 1.15l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.4 10.5H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1"/>',
    search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    check:    '<path d="m4.5 12.5 5 5 10-11"/>',
    x:        '<path d="M6 6l12 12M18 6 6 18"/>',
    chevR:    '<path d="m9 5 7 7-7 7"/>',
    chevL:    '<path d="m15 5-7 7 7 7"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    phone:    '<path d="M6.5 3h3l1.6 4-2.1 1.5a12 12 0 0 0 5.5 5.5L16 11.9l4 1.6v3a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 3 6.2 2 2 0 0 1 5 4h1.5Z"/>',
    chat:     '<path d="M21 11.5a8 8 0 0 1-11.6 7.1L3 20.5l1.9-6.3A8 8 0 1 1 21 11.5Z"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    sun:      '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>',
    moon:     '<path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>',
    alert:    '<path d="M12 4.5 2.8 20h18.4L12 4.5Z"/><path d="M12 10v4M12 17.2v.1"/>',
    refresh:  '<path d="M20 11A8 8 0 0 0 6.3 6.3L3.5 9"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20.5 15"/><path d="M3.5 4v5h5M20.5 20v-5h-5"/>',
    undo:     '<path d="M3 8h11a5.5 5.5 0 0 1 0 11H8"/><path d="M3 8l4-4M3 8l4 4"/>',
    sparkle:  '<path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 11 10.1 9 12 3.5Z"/><path d="M18.5 3.5v3M20 5h-3"/>',
    tooth:    '<path d="M12 3.2c-2 0-2.6 1-4.6 1C5.6 4.2 4 5.6 4 8.4c0 3 .9 4.3 1.6 7 .5 2 .6 5.4 2.3 5.4 1.6 0 1.5-3 2.3-5.1.4-1.1.9-1.6 1.8-1.6s1.4.5 1.8 1.6c.8 2.1.7 5.1 2.3 5.1 1.7 0 1.8-3.4 2.3-5.4.7-2.7 1.6-4 1.6-7 0-2.8-1.6-4.2-3.4-4.2-2 0-2.6-1-4.6-1Z"/>',
    braces:   '<path d="M3 9.5h18M3 14.5h18"/><path d="M7 7v10M12 7v10M17 7v10"/>',
    implant:  '<path d="M12 3v7"/><path d="M8.5 10h7l-1 4.5c-.4 1.9-.8 5.5-2.5 5.5s-2.1-3.6-2.5-5.5L8.5 10Z"/><path d="M9.5 6.5h5M9 8.5h6"/>',
    kid:      '<circle cx="12" cy="9" r="5"/><path d="M9.7 8.4v.1M14.3 8.4v.1M9.6 11.4a3 3 0 0 0 4.8 0"/><path d="M5 21c.6-3 3.5-4.6 7-4.6s6.4 1.6 7 4.6"/>',
    shine:    '<circle cx="11" cy="12" r="6"/><path d="M19.5 4.5v3.4M21.2 6.2h-3.4M17.8 15.5v2.2M18.9 16.6h-2.2"/>',
    urgent:   '<path d="M13 2 4.5 13.2H11L10 22l8.5-11.2H12L13 2Z"/>',
    ticket:   '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1a2.5 2.5 0 0 0 0 5v1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5v-1a2.5 2.5 0 0 0 0-5v-1Z"/><path d="M13 6v12"/>',
    inbox:    '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 4h13l2.5 9v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2.5-9Z"/>',
    star:     '<path d="m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9L12 3.5Z"/>',
    trend:    '<path d="M3 17.5 9.5 11l4 4L21 7.5"/><path d="M15.5 7.5H21v5.5"/>',

    /* one mark per department the clinic actually runs */
    mirror:   '<circle cx="8.5" cy="8.5" r="5"/><path d="m12.4 12.4 7 7"/><path d="M18.6 17.2 20.8 19.4a1.6 1.6 0 0 1-2.2 2.2l-2.2-2.2"/>',
    canal:    '<path d="M12 3.2c-1.9 0-2.5 1-4.4 1C5.9 4.2 4.4 5.5 4.4 8.2c0 2.9.9 4.1 1.5 6.7.5 1.9.6 5.2 2.2 5.2 1.5 0 1.4-2.9 2.2-4.9.4-1 .9-1.5 1.7-1.5s1.3.5 1.7 1.5c.8 2 .7 4.9 2.2 4.9 1.6 0 1.7-3.3 2.2-5.2.6-2.6 1.5-3.8 1.5-6.7 0-2.7-1.5-4-3.2-4-1.9 0-2.5-1-4.4-1Z"/><path d="M10.6 9v8M13.4 9v8"/>',
    smile:    '<circle cx="12" cy="12" r="9"/><path d="M8.2 13.4a4.6 4.6 0 0 0 7.6 0Z"/><path d="M8.6 9.2v.1M15.4 9.2v.1"/>',
    arch:     '<path d="M3.6 16.5a8.4 8.4 0 0 1 16.8 0"/><path d="M6.4 11.4v4.6M9.6 9.1v6M14.4 9.1v6M17.6 11.4v4.6M12 8.5v7.2"/>',
    jaw:      '<path d="M4 6.5v5.2c0 4.3 3.6 7.8 8 7.8h5.4"/><path d="M4 6.5h9.4"/><circle cx="18.6" cy="6.4" r="2.4"/><path d="M8 9.4v2.6M11.4 9.4v2.6"/>',
    sleep:    '<path d="M3.4 14.6a7.6 7.6 0 0 0 14.8-2.2"/><path d="M13.4 4.6h5l-5 5.4h5"/><path d="M6.4 18.6h3M12.4 18.6h2"/>'
  };

  function ic(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[name] || "") + "</svg>";
  }

  /* ---------- copy: English + Tamil -------------------------------- */

  var COPY = {
    en: {
      book: "Book an appointment", branch: "Which clinic?", branchHint: "Choose the branch nearest to you.",
      treat: "What do you need?", treatHint: "Pick the reason for your visit.",
      when: "Pick a day and time", whenHint: "Only free times are shown. Tap one.",
      you: "Your details", youHint: "We only need your name and phone number.",
      morning: "Morning", evening: "Evening", name: "Full name", phone: "Mobile number",
      email: "Email (optional)", first: "Is this your first visit?", yes: "Yes, first time",
      no: "No, I've been before", notes: "Anything we should know? (optional)",
      confirm: "Confirm booking", back: "Back", next: "Continue",
      closedDay: "The clinic is closed on Sundays. Please choose another day.",
      noSlots: "No free times left on this day. Try the next one.",
      doneTitle: "You're booked.", doneSub: "We've sent the details to your WhatsApp.",
      another: "Book another appointment", ref: "Reference",
      minutes: "min", withDr: "with", free: "free", full: "full", closed: "closed",
      errName: "Please enter your name.", errPhone: "Enter a 10-digit mobile number."
    },
    ta: {
      book: "நேரம் பதிவு செய்யுங்கள்", branch: "எந்த கிளினிக்?", branchHint: "உங்களுக்கு அருகில் உள்ள கிளையைத் தேர்ந்தெடுக்கவும்.",
      treat: "உங்களுக்கு என்ன தேவை?", treatHint: "வருகையின் காரணத்தைத் தேர்ந்தெடுக்கவும்.",
      when: "நாள் மற்றும் நேரம்", whenHint: "காலியாக உள்ள நேரங்கள் மட்டும். ஒன்றைத் தொடவும்.",
      you: "உங்கள் விவரங்கள்", youHint: "பெயர் மற்றும் கைபேசி எண் மட்டும் போதும்.",
      morning: "காலை", evening: "மாலை", name: "முழு பெயர்", phone: "கைபேசி எண்",
      email: "மின்னஞ்சல் (விருப்பம்)", first: "இது உங்கள் முதல் வருகையா?", yes: "ஆம், முதல் முறை",
      no: "இல்லை, முன்பு வந்துள்ளேன்", notes: "நாங்கள் தெரிந்து கொள்ள வேண்டியது? (விருப்பம்)",
      confirm: "பதிவை உறுதி செய்", back: "பின்", next: "தொடரவும்",
      closedDay: "ஞாயிறு அன்று கிளினிக் மூடப்பட்டிருக்கும். வேறு நாளைத் தேர்வு செய்யவும்.",
      noSlots: "இந்த நாளில் நேரம் இல்லை. அடுத்த நாளைப் பாருங்கள்.",
      doneTitle: "பதிவு முடிந்தது.", doneSub: "விவரங்கள் உங்கள் WhatsApp-க்கு அனுப்பப்பட்டன.",
      another: "மற்றொரு நேரம் பதிவு செய்", ref: "குறிப்பு எண்",
      minutes: "நிமிடம்", withDr: "டாக்டர்", free: "காலி", full: "நிரம்பியது", closed: "மூடப்பட்டது",
      errName: "உங்கள் பெயரை உள்ளிடவும்.", errPhone: "10 இலக்க கைபேசி எண்ணை உள்ளிடவும்."
    }
  };

  /* ---------- app state ------------------------------------------- */

  var app = {
    view: "patient",
    lang: "en",
    theme: null,
    backend: "…",

    pt: { step: 1, branchId: null, catId: null, treatmentId: null, date: null, slot: null,
          name: "", phone: "", email: "", isNew: null, notes: "", errors: {}, booked: null },

    rm: { aptId: null, mode: null, date: null, slot: null,
          flags: {}, note: "", rating: 0, sent: false },

    st: { tab: "today", branch: "all", q: "", calMode: "day", calDate: null,
          drawer: null, modal: null, cmd: null, cmdQ: "", cmdIdx: 0 }
  };

  function t(k) { return (COPY[app.lang] || COPY.en)[k] || COPY.en[k] || k; }

  /* ---------- deep links -------------------------------------------
     Each surface gets its own address, so the clinic can bookmark the
     dashboard and the website can link straight to the booking page. */

  var ROUTES = { book: "patient", reminder: "reminder", dashboard: "staff" };
  var VIEW_TO_ROUTE = { patient: "book", reminder: "reminder", staff: "dashboard" };

  function viewFromHash() {
    var key = (location.hash || "").replace(/^#\/?/, "").toLowerCase();
    return ROUTES[key] || null;
  }

  function goTo(view, replace) {
    app.view = view;
    var hash = "#" + VIEW_TO_ROUTE[view];
    if (location.hash !== hash) {
      if (replace && location.replace) history.replaceState(null, "", hash);
      else location.hash = hash;
    }
  }

  window.addEventListener("hashchange", function () {
    var v = viewFromHash();
    if (v && v !== app.view) { app.view = v; render(); window.scrollTo(0, 0); }
  });

  /* ---------- toasts ---------------------------------------------- */

  var toastSeq = 0;
  function toast(msg, opts) {
    opts = opts || {};
    var rail = $("#toast-rail");
    var node = document.createElement("div");
    var id = "tst" + (++toastSeq);
    node.className = "toast";
    node.id = id;
    node.innerHTML = ic(opts.icon || "check") + "<span>" + esc(msg) + "</span>" +
      (opts.undo ? '<button class="undo" type="button">Undo</button>' : "");
    rail.appendChild(node);

    var timer = setTimeout(close, opts.undo ? 6000 : 2600);
    function close() {
      clearTimeout(timer);
      node.classList.add("out");
      setTimeout(function () { node.remove(); }, 250);
    }
    if (opts.undo) {
      $(".undo", node).addEventListener("click", function () { opts.undo(); close(); });
    }
    return close;
  }

  /* ---------- theme ------------------------------------------------ */

  function currentTheme() {
    if (app.theme) return app.theme;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function flipTheme() {
    app.theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", app.theme);
    render();
  }

  /* ============================================================
     PATIENT — booking flow
     ============================================================ */

  function ptSteps() {
    var labels = ["Clinic", "Treatment", "Day & time", "Details"];
    var cur = app.pt.step;
    var out = '<nav class="steps" aria-label="Booking progress">';
    for (var i = 0; i < 4; i++) {
      var n = i + 1;
      var cls = n < cur ? "node done" : (n === cur ? "node on" : "node");
      out += '<div class="' + cls + '">' +
        '<span class="dot">' + (n < cur ? ic("check") : n) + "</span>" +
        '<span class="label">' + labels[i] + "</span></div>";
      if (i < 3) out += '<div class="bar' + (n < cur ? " done" : "") + '"><i></i></div>';
    }
    return out + "</nav>";
  }

  function ptBranch() {
    var h = '<div class="pane"><h2>' + t("branch") + '</h2><p class="hint">' + t("branchHint") + "</p>";
    h += '<div class="choices two">';
    C.branches.forEach(function (b) {
      h += '<button class="choice" type="button" data-branch="' + b.id + '" ' +
        'aria-pressed="' + (app.pt.branchId === b.id) + '">' +
        '<span class="ic">' + ic("building") + "</span>" +
        '<span><span class="t">' + esc(b.name) + '</span>' +
        '<span class="d">' + esc(b.area) + "</span></span>" +
        '<span class="chev">' + ic("chevR") + "</span></button>";
    });
    return h + "</div></div>";
  }

  function ptTreatment() {
    var p = app.pt;
    var h = '<div class="pane"><h2>' + t("treat") + '</h2><p class="hint">' + t("treatHint") + "</p>";
    h += '<div class="choices tiles">';

    C.categories.forEach(function (cat) {
      var items = S.T.inCategory(cat.id, p.branchId);
      if (!items.length) return;
      var open = p.catId === cat.id;
      var label = app.lang === "ta" ? cat.ta : cat.name;
      var docs = {};
      items.forEach(function (it) {
        S.doctorsFor(it.id, p.branchId).forEach(function (dd) { docs[dd.short] = true; });
      });

      h += '<button class="choice tile" type="button" data-cat="' + cat.id + '" ' +
        'aria-pressed="' + open + '">' +
        '<span class="ic">' + ic(cat.icon) + '</span>' +
        '<span class="t">' + esc(label) + '</span>' +
        '<span class="d">' + esc(Object.keys(docs).join(", ")) + '</span>' +
        '<span class="mins">' + items.length + ' ' + (items.length === 1 ? "option" : "options") + '</span>' +
        '</button>';

      /* the department's real treatments open in place — no extra step */
      if (open) {
        h += '<div class="variants"><div class="vhead">' + esc(cat.name) + '</div>';
        items.forEach(function (it) {
          h += '<button class="variant" type="button" data-treat="' + it.id + '" ' +
            'aria-pressed="' + (p.treatmentId === it.id) + '">' +
            '<span class="vn">' + esc(it.name) + '</span>' +
            '<span class="vd">' + it.mins + ' ' + t("minutes") + '</span></button>';
        });
        h += '</div>';
      }
    });
    return h + '</div></div>';
  }

  function ptWhen() {
    var p = app.pt;
    var h = '<div class="pane"><h2>' + t("when") + '</h2><p class="hint">' + t("whenHint") + "</p>";

    h += '<div class="datestrip" role="group" aria-label="Choose a date">';
    for (var i = 0; i < 14; i++) {
      var d = U.addDays(S.today(), i);
      var dISO = U.iso(d);
      var open = S.isOpen(dISO);
      var free = open ? S.freeSlots(dISO, p.branchId, p.treatmentId).length : 0;
      var lbl = !open ? t("closed") : (free ? free + " " + t("free") : t("full"));
      h += '<button class="daybtn" type="button" data-date="' + dISO + '" ' +
        'aria-pressed="' + (p.date === dISO) + '"' + (open && free ? "" : " disabled") + ">" +
        '<span class="dow">' + (i === 0 ? "Today" : dayName(dISO)) + "</span>" +
        '<span class="dd num">' + d.getDate() + "</span>" +
        '<span class="mon">' + monName(dISO) + "</span>" +
        '<span class="free">' + lbl + "</span></button>";
    }
    h += "</div>";

    if (!p.date) {
      h += '<div class="closed">' + ic("calendar") + "<span>Pick a day above to see free times.</span></div>";
      return h + "</div>";
    }
    if (!S.isOpen(p.date)) {
      h += '<div class="closed">' + ic("alert") + "<span>" + t("closedDay") + "</span></div>";
      return h + "</div>";
    }

    var slots = S.freeSlots(p.date, p.branchId, p.treatmentId);
    if (!slots.length) {
      h += '<div class="closed">' + ic("alert") + "<span>" + t("noSlots") + "</span></div>";
      return h + "</div>";
    }

    var groups = [
      { key: "morning", icon: "sun", rows: slots.filter(function (s) { return U.minutesOf(s.time) < 14 * 60; }) },
      { key: "evening", icon: "moon", rows: slots.filter(function (s) { return U.minutesOf(s.time) >= 14 * 60; }) }
    ];
    groups.forEach(function (g) {
      if (!g.rows.length) return;
      h += '<section class="slotgroup"><header><span class="ic">' + ic(g.icon) + "</span>" +
        "<h3>" + t(g.key) + '</h3><span class="count num">' + g.rows.length + " " + t("free") + "</span></header>" +
        '<div class="slots">';
      g.rows.forEach(function (s) {
        var on = p.slot && p.slot.time === s.time && p.slot.doctorId === s.doctorId;
        h += '<button class="slot" type="button" data-slot="' + s.time + "|" + s.doctorId + '" ' +
          'aria-pressed="' + on + '">' +
          '<span class="tm num">' + U.pretty(s.time) + "</span>" +
          '<span class="dr">' + esc(s.doctorShort) + "</span></button>";
      });
      h += "</div></section>";
    });
    return h + "</div>";
  }

  function ptDetails() {
    var p = app.pt, e = p.errors;
    var tr = S.T.treatment(p.treatmentId), br = S.T.branch(p.branchId);
    var doc = S.T.doctor(p.slot.doctorId);

    var h = '<div class="pane"><h2>' + t("you") + '</h2><p class="hint">' + t("youHint") + "</p>";
    h += '<div class="stack">';

    h += '<div class="summary"><h4 class="eyebrow">Your appointment</h4>' +
      '<div class="srow"><dt>Clinic</dt><dd>' + esc(br.name) + "</dd></div>" +
      '<div class="srow"><dt>Treatment</dt><dd>' + esc(tr.name) + "</dd></div>" +
      '<div class="srow"><dt>Day</dt><dd>' + niceDate(p.date) + ", " + U.parseISO(p.date).getDate() + " " + monName(p.date) + "</dd></div>" +
      '<div class="srow"><dt>Time</dt><dd class="num">' + U.pretty(p.slot.time) + "</dd></div>" +
      '<div class="srow"><dt>Doctor</dt><dd>' + esc(doc.short) + "</dd></div></div>";

    h += '<div class="field"><label for="f-name">' + t("name") + ' <span class="req">*</span></label>' +
      '<input class="input' + (e.name ? " bad" : "") + '" id="f-name" type="text" autocomplete="name" ' +
      'placeholder="e.g. Karthik Raman" value="' + esc(p.name) + '">' +
      (e.name ? '<span class="err">' + t("errName") + "</span>" : "") + "</div>";

    h += '<div class="field"><label for="f-phone">' + t("phone") + ' <span class="req">*</span></label>' +
      '<div class="phonewrap"><span class="cc">+91</span>' +
      '<input class="input' + (e.phone ? " bad" : "") + '" id="f-phone" type="tel" inputmode="numeric" ' +
      'maxlength="10" autocomplete="tel" placeholder="98765 43210" value="' + esc(p.phone) + '"></div>' +
      (e.phone ? '<span class="err">' + t("errPhone") + "</span>"
               : '<span class="note">We send the confirmation here on WhatsApp.</span>') + "</div>";

    h += '<div class="field"><label for="f-email">' + t("email") + "</label>" +
      '<input class="input" id="f-email" type="email" autocomplete="email" ' +
      'placeholder="you@example.com" value="' + esc(p.email) + '"></div>';

    h += '<div class="field"><label>' + t("first") + "</label>" +
      '<div class="pills">' +
      '<button class="pill" type="button" data-new="1" aria-pressed="' + (p.isNew === true) + '">' + t("yes") + "</button>" +
      '<button class="pill" type="button" data-new="0" aria-pressed="' + (p.isNew === false) + '">' + t("no") + "</button>" +
      "</div></div>";

    h += '<div class="field"><label for="f-notes">' + t("notes") + "</label>" +
      '<textarea class="input" id="f-notes" placeholder="Pain, swelling, medicines you take…">' + esc(p.notes) + "</textarea></div>";

    return h + "</div></div>";
  }

  function ptDone() {
    var a = app.pt.booked;
    var tr = S.T.treatment(a.treatmentId), br = S.T.branch(a.branchId), doc = S.T.doctor(a.doctorId);
    var msg = C.templates.confirm
      .replace("{name}", a.name.split(" ")[0])
      .replace("{branch}", br.name)
      .replace("{date}", niceDate(a.date) + ", " + U.parseISO(a.date).getDate() + " " + monName(a.date))
      .replace("{time}", U.pretty(a.time))
      .replace("{treatment}", tr.name)
      .replace("{doctor}", doc.short);

    return '<div class="pane done-wrap">' +
      '<div class="done-mark">' + ic("check") + "</div>" +
      "<h2>" + t("doneTitle") + "</h2><p>" + t("doneSub") + "</p>" +
      '<div class="ticket">' + ic("ticket") + t("ref") + " <b>" + esc(a.code) + "</b></div>" +
      '<div class="summary">' +
        '<div class="srow"><dt>Clinic</dt><dd>' + esc(br.name) + "</dd></div>" +
        '<div class="srow"><dt>Address</dt><dd>' + esc(br.area) + "</dd></div>" +
        '<div class="srow"><dt>Treatment</dt><dd>' + esc(tr.name) + "</dd></div>" +
        '<div class="srow"><dt>Day</dt><dd>' + niceDate(a.date) + ", " + U.parseISO(a.date).getDate() + " " + monName(a.date) + "</dd></div>" +
        '<div class="srow"><dt>Time</dt><dd class="num">' + U.pretty(a.time) + "</dd></div>" +
        '<div class="srow"><dt>Doctor</dt><dd>' + esc(doc.name) + "</dd></div>" +
      "</div>" +
      '<div class="msgpreview"><header>' + ic("chat") + "Sent to +91 " + esc(a.phone) + "</header>" +
      '<div class="bubble">' + esc(msg) + "</div></div>" +
      '<div class="actions" style="justify-content:center">' +
      '<button class="btn ghost" type="button" data-act="restart">' + t("another") + "</button></div></div>";
  }

  function ptFooter() {
    var p = app.pt;
    var can = p.step === 1 ? !!p.branchId
            : p.step === 2 ? !!p.treatmentId
            : p.step === 3 ? !!p.slot
            : true;
    var last = p.step === 4;
    return '<div class="actions">' +
      (p.step > 1 ? '<button class="btn ghost" type="button" data-act="back">' + ic("chevL") + t("back") + "</button>" : "") +
      '<button class="btn primary" type="button" data-act="' + (last ? "submit" : "next") + '"' +
      (can ? "" : " disabled") + ">" +
      (last ? ic("check") + t("confirm") : t("next") + ic("chevR")) + "</button></div>";
  }

  function renderPatient() {
    var p = app.pt;
    var body;
    if (p.booked) body = ptDone();
    else if (p.step === 1) body = ptBranch() + ptFooter();
    else if (p.step === 2) body = ptTreatment() + ptFooter();
    else if (p.step === 3) body = ptWhen() + ptFooter();
    else body = ptDetails() + ptFooter();

    return '<div class="pt"><div class="pt-head">' +
      '<div class="pt-logo"><span class="glyph">' + ic("tooth") + "</span>" +
      '<span><span class="name">' + esc(C.name) + '</span><span class="sub">' + esc(C.tagline) + "</span></span></div>" +
      '<div class="langtoggle" role="group" aria-label="Language">' +
      '<button type="button" data-lang="en" aria-pressed="' + (app.lang === "en") + '">English</button>' +
      '<button type="button" data-lang="ta" aria-pressed="' + (app.lang === "ta") + '">தமிழ்</button></div></div>' +
      '<div class="pt-shell">' + (p.booked ? "" : ptSteps()) + body + "</div></div>";
  }

  /* ---------- patient interactions -------------------------------- */

  function ptCapture() {
    var n = $("#f-name"), ph = $("#f-phone"), em = $("#f-email"), no = $("#f-notes");
    if (n) app.pt.name = n.value;
    if (ph) app.pt.phone = ph.value.replace(/\D/g, "").slice(0, 10);
    if (em) app.pt.email = em.value;
    if (no) app.pt.notes = no.value;
  }

  function ptNext() {
    var p = app.pt;
    if (p.step === 3 && !p.slot) return;
    p.step = Math.min(4, p.step + 1);
    render();
  }

  function ptSubmit() {
    ptCapture();
    var p = app.pt;
    p.errors = {};
    if (!p.name.trim() || p.name.trim().length < 2) p.errors.name = true;
    if (!/^[6-9]\d{9}$/.test(p.phone)) p.errors.phone = true;
    if (Object.keys(p.errors).length) {
      render();
      var bad = $(".input.bad");
      if (bad) bad.focus();
      return;
    }
    /* Guard against the slot being taken while the form was open. */
    var still = S.freeSlots(p.date, p.branchId, p.treatmentId).some(function (s) {
      return s.time === p.slot.time && s.doctorId === p.slot.doctorId;
    });
    if (!still) {
      p.slot = null; p.step = 3; render();
      toast("That time was just taken. Please pick another.", { icon: "alert" });
      return;
    }
    S.book({
      date: p.date, time: p.slot.time, branchId: p.branchId,
      treatmentId: p.treatmentId, doctorId: p.slot.doctorId,
      name: p.name.trim(), phone: p.phone, email: p.email.trim(),
      isNew: p.isNew !== false, notes: p.notes.trim(), source: "online"
    }).then(function (apt) {
      app.pt.booked = apt;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }


  /* ============================================================
     PATIENT LINK — what opens when they tap the WhatsApp reminder
     ============================================================ */

  var MED_FLAGS = [
    "Diabetes", "Blood pressure", "Heart condition", "Asthma",
    "Pregnant", "On blood thinners", "Allergic to any medicine", "Nothing to declare"
  ];

  /* Which appointment is this link for? In the real product the link
     carries a signed token. Here we follow the clinic's next booking. */
  function rmApt() {
    if (app.rm.aptId) {
      var pinned = S.find(app.rm.aptId);
      if (pinned) return pinned;
    }
    var todayISO = U.iso(S.today());
    var upcoming = S.appointments.filter(function (a) {
      return (a.status === "booked" || a.status === "arrived") && a.date >= todayISO;
    }).sort(function (x, y) { return (x.date + x.time).localeCompare(y.date + y.time); });
    if (upcoming.length) { app.rm.aptId = upcoming[0].id; return upcoming[0]; }

    var past = S.appointments.filter(function (a) { return a.status === "done"; })
      .sort(function (x, y) { return (y.date + y.time).localeCompare(x.date + x.time); });
    if (past.length) { app.rm.aptId = past[0].id; return past[0]; }
    return null;
  }

  function rmDetails(a) {
    var tr = S.T.treatment(a.treatmentId), br = S.T.branch(a.branchId), doc = S.T.doctor(a.doctorId);
    return '<div class="summary">' +
      '<div class="srow"><dt>Treatment</dt><dd>' + esc(tr ? tr.name : "\u2014") + '</dd></div>' +
      '<div class="srow"><dt>Doctor</dt><dd>' + esc(doc ? doc.name : "\u2014") + '</dd></div>' +
      '<div class="srow"><dt>Clinic</dt><dd>' + esc(br ? br.name : "\u2014") + '</dd></div>' +
      '<div class="srow"><dt>Address</dt><dd>' + esc(br ? br.area : "") + '</dd></div>' +
      '<div class="srow"><dt>Reference</dt><dd class="num">' + esc(a.code || "\u2014") + '</dd></div>' +
      '</div>';
  }

  function rmReschedule(a) {
    var r = app.rm;
    var h = '<div class="rm-card"><h3>Pick a new time</h3>' +
      '<p class="hint">Only free times are shown.</p>';
    h += '<div class="datestrip">';
    for (var i = 0; i < 10; i++) {
      var d = U.addDays(S.today(), i), dISO = U.iso(d);
      var open = S.isOpen(dISO);
      var free = open ? S.freeSlots(dISO, a.branchId, a.treatmentId).length : 0;
      h += '<button class="daybtn" type="button" data-rdate="' + dISO + '" aria-pressed="' +
        (r.date === dISO) + '"' + (free ? "" : " disabled") + '>' +
        '<span class="dow">' + (i === 0 ? "Today" : dayName(dISO)) + '</span>' +
        '<span class="dd num">' + d.getDate() + '</span>' +
        '<span class="mon">' + monName(dISO) + '</span>' +
        '<span class="free">' + (open ? free + " free" : "closed") + '</span></button>';
    }
    h += '</div>';

    if (r.date) {
      var slots = S.freeSlots(r.date, a.branchId, a.treatmentId);
      h += '<div class="slots" style="margin-top:14px">';
      slots.forEach(function (sl) {
        var on = r.slot && r.slot.time === sl.time && r.slot.doctorId === sl.doctorId;
        h += '<button class="slot" type="button" data-rslot="' + sl.time + "|" + sl.doctorId + '" ' +
          'aria-pressed="' + on + '"><span class="tm num">' + U.pretty(sl.time) + '</span>' +
          '<span class="dr">' + esc(sl.doctorShort) + '</span></button>';
      });
      h += '</div>';
    }

    h += '<div class="actions">' +
      '<button class="btn ghost" type="button" data-rm="cancel-move">Keep my old time</button>' +
      '<button class="btn primary" type="button" data-rm="save-move"' +
      (r.slot ? "" : " disabled") + '>' + ic("check") + 'Move my appointment</button></div></div>';
    return h;
  }

  function rmMedical(a) {
    var saved = a.medical && a.medical.saved;
    var flags = app.rm.flags;
    var h = '<div class="rm-card"><h3>Before you come in</h3>' +
      '<p class="hint">' + (saved
        ? "Thank you \u2014 the doctor can see this already."
        : "Two taps now saves ten minutes at the desk.") + '</p>';

    if (saved) {
      var picked = (a.medical.flags || []);
      h += '<div class="chipset">' + (picked.length
        ? picked.map(function (f) { return '<span class="chip on static">' + esc(f) + '</span>'; }).join("")
        : '<span class="chip static">Nothing declared</span>') + '</div>';
      if (a.medical.note) h += '<div class="tpl" style="margin-top:10px">' + esc(a.medical.note) + '</div>';
      h += '<div class="actions"><button class="btn ghost sm" type="button" data-rm="edit-med">Change my answers</button></div>';
      return h + '</div>';
    }

    h += '<div class="chipset">';
    MED_FLAGS.forEach(function (f) {
      h += '<button class="chip" type="button" data-flag="' + esc(f) + '" aria-pressed="' +
        (!!flags[f]) + '">' + esc(f) + '</button>';
    });
    h += '</div>';
    h += '<div class="field" style="margin-top:12px"><label for="rm-note">Anything else the doctor should know?</label>' +
      '<textarea class="input" id="rm-note" placeholder="Medicines you take, past surgery, what is hurting\u2026">' +
      esc(app.rm.note) + '</textarea></div>';
    h += '<div class="actions"><button class="btn primary" type="button" data-rm="save-med">' +
      ic("check") + 'Send to the doctor</button></div>';
    return h + '</div>';
  }

  function rmFeedback(a) {
    var r = app.rm;
    var given = a.feedback && a.feedback.rating;
    var score = given || r.rating;
    var h = '<div class="rm-card"><h3>How did it go?</h3>' +
      '<p class="hint">' + (given ? "Thank you for telling us." : "One tap. It helps the whole team.") + '</p>';
    h += '<div class="stars" role="group" aria-label="Rating">';
    for (var i = 1; i <= 5; i++) {
      h += '<button class="star" type="button" data-star="' + i + '" aria-label="' + i +
        ' out of 5" aria-pressed="' + (score >= i) + '"' + (given ? " disabled" : "") + '>' +
        ic("star") + '</button>';
    }
    h += '</div>';

    if (!given && score) {
      if (score >= 4) {
        h += '<p class="hint" style="margin-top:14px">Wonderful. Would you put that in a Google review? ' +
          'It is the single biggest help you can give a small clinic.</p>' +
          '<div class="actions"><button class="btn primary" type="button" data-rm="review">' +
          ic("star") + 'Leave a Google review</button>' +
          '<button class="btn ghost" type="button" data-rm="skip-review">Not now</button></div>';
      } else {
        h += '<div class="field" style="margin-top:14px"><label for="rm-fb">What went wrong?</label>' +
          '<textarea class="input" id="rm-fb" placeholder="Tell us honestly. It comes straight to the owner, not to a public page."></textarea></div>' +
          '<div class="actions"><button class="btn primary" type="button" data-rm="send-fb">' +
          ic("chat") + 'Send privately to the owner</button></div>';
      }
    }
    if (given) {
      h += '<div class="banner ok" style="margin-top:14px">' + ic("check") +
        '<span>Rated ' + given + ' out of 5. Thank you.</span></div>';
    }
    return h + '</div>';
  }

  function renderReminder() {
    var a = rmApt();
    var head = '<div class="rm-head"><span class="glyph">' + ic("tooth") + '</span>' +
      '<span><span class="name">' + esc(C.name) + '</span>' +
      '<span class="sub">' + esc(C.tagline) + '</span></span>' +
      '<span class="chan">' + ic("chat") + 'From your WhatsApp reminder</span></div>';

    if (!a) {
      return '<div class="rm">' + head +
        '<div class="rm-card"><div class="empty">' + ic("calendar") +
        '<span class="t">Nothing booked</span><p>You have no upcoming appointment with us.</p></div></div></div>';
    }

    var tr = S.T.treatment(a.treatmentId);
    var body = "";

    /* ---- after the visit: feedback and the review ask ---- */
    if (a.status === "done") {
      body += '<div class="rm-card lead">' +
        '<span class="eyebrow">Your visit</span>' +
        '<h2>' + esc(tr ? tr.name : "Your appointment") + '</h2>' +
        '<p class="when">' + niceDate(a.date) + ' \u00b7 ' + U.pretty(a.time) + '</p>' +
        rmDetails(a) + '</div>';
      body += rmFeedback(a);
      body += '<div class="rm-card"><h3>Time for your next visit?</h3>' +
        '<p class="hint">' + (tr && tr.recallDays
          ? "After " + esc(tr.name) + " we normally see you again in " + gapWords(tr.recallDays) + "."
          : "Book whenever you need us.") + '</p>' +
        '<div class="actions"><button class="btn quiet" type="button" data-rm="rebook">' +
        ic("calendar") + 'Book my next visit</button></div></div>';
      return '<div class="rm">' + head + body + '</div>';
    }

    if (a.status === "cancelled") {
      body += '<div class="rm-card lead"><div class="banner miss">' + ic("x") +
        '<span>This appointment is cancelled.</span></div>' +
        '<p class="hint" style="margin-top:12px">The slot has been released, so someone else can take it.</p>' +
        '<div class="actions"><button class="btn primary" type="button" data-rm="rebook">' +
        ic("calendar") + 'Book a new time</button>' +
        '<button class="btn ghost" type="button" data-rm="next-apt">My other appointments</button>' +
        '</div></div>';
      return '<div class="rm">' + head + body + '</div>';
    }

    /* ---- the live reminder ---- */
    var confirmed = !!a.confirmed;
    body += '<div class="rm-card lead">' +
      '<span class="eyebrow">' + (a.date === U.iso(S.today()) ? "Today" : "Your appointment") + '</span>' +
      '<h2>' + niceDate(a.date) + ' at ' + U.pretty(a.time) + '</h2>' +
      '<p class="when">' + esc(tr ? tr.name : "") + ' \u00b7 ' + (a.mins || 30) + ' minutes</p>';

    if (confirmed) {
      body += '<div class="banner ok">' + ic("check") + '<span>You have confirmed. See you then.</span></div>';
    }
    body += rmDetails(a);

    if (app.rm.mode === "move") {
      body += '</div>' + rmReschedule(a);
    } else {
      body += '<div class="bigrow">';
      if (!confirmed) {
        body += '<button class="bigbtn go" type="button" data-rm="confirm">' + ic("check") +
          '<span>I will come</span></button>';
      }
      body += '<button class="bigbtn" type="button" data-rm="move">' + ic("calendar") +
        '<span>Change time</span></button>' +
        '<button class="bigbtn stop" type="button" data-rm="drop">' + ic("x") +
        '<span>Cancel</span></button></div></div>';
      body += rmMedical(a);
    }

    var br = S.T.branch(a.branchId);
    body += '<div class="rm-card quiet-card"><h3>Getting there</h3>' +
      '<p class="hint">' + esc(br ? br.area : "") + '</p>' +
      '<div class="actions">' +
      '<a class="btn quiet" href="https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent((br ? br.name + " " + br.area : "")) + '" target="_blank" rel="noopener">' +
      ic("building") + 'Open in Maps</a>' +
      '<a class="btn quiet" href="tel:' + esc((br ? br.phone : "").replace(/\s/g, "")) + '">' +
      ic("phone") + 'Call the clinic</a></div></div>';

    return '<div class="rm">' + head + body + '</div>';
  }

  /* ============================================================
     STAFF — dashboard
     ============================================================ */

  function visible() {
    return S.appointments.filter(function (a) {
      return app.st.branch === "all" || a.branchId === app.st.branch;
    });
  }

  function stNav() {
    var todayISO = U.iso(S.today());
    var pending = visible().filter(function (a) {
      return a.date === todayISO && (a.status === "booked" || a.status === "arrived");
    }).length;
    var recallN = S.recalls().filter(function (r) { return r.overdueBy >= 0; }).length;

    var items = [
      ["today", "home", "Today", pending, "calm"],
      ["calendar", "calendar", "Calendar", 0, ""],
      ["patients", "users", "Patients", 0, ""],
      ["recall", "bell", "Recall", recallN, ""],
      ["reports", "chart", "Reports", 0, ""],
      ["settings", "settings", "Settings", 0, ""]
    ];

    var h = '<nav class="rail" aria-label="Sections">' +
      '<div class="brandrow"><span class="glyph">' + ic("tooth") + "</span>" +
      '<span><span class="n">' + esc(C.name) + '</span><br><span class="r">Front desk</span></span></div>';

    items.forEach(function (it, i) {
      if (i === 4) h += '<div class="sep"></div>';
      h += '<button class="navitem" type="button" data-tab="' + it[0] + '"' +
        (app.st.tab === it[0] ? ' aria-current="page"' : "") + ">" +
        ic(it[1]) + "<span>" + it[2] + "</span>" +
        (it[3] ? '<span class="badge ' + it[4] + ' num">' + it[3] + "</span>" : "") + "</button>";
    });

    h += '<div class="kbd-hint"><kbd>Ctrl</kbd> <kbd>K</kbd> search anything<br>' +
      '<kbd>N</kbd> new appointment</div>';
    return h + "</nav>";
  }

  function stTop() {
    var titles = { today: "Today", calendar: "Calendar", patients: "Patients",
                   recall: "Recall list", reports: "Reports", settings: "Settings" };
    var h = '<div class="topbar"><h1>' + titles[app.st.tab] + "</h1>";
    h += '<div class="branchpick" role="group" aria-label="Branch">' +
      '<button type="button" data-br="all" aria-pressed="' + (app.st.branch === "all") + '">Both</button>';
    C.branches.forEach(function (b) {
      h += '<button type="button" data-br="' + b.id + '" aria-pressed="' + (app.st.branch === b.id) + '">' +
        esc(b.name) + "</button>";
    });
    h += "</div>";
    h += '<div class="spacer"></div>';
    h += '<label class="searchbox"><span class="sr">Search</span>' + ic("search") +
      '<input id="st-search" type="search" placeholder="Search patient or phone…" value="' + esc(app.st.q) + '">' +
      "<kbd>Ctrl K</kbd></label>";
    h += '<button class="btn primary sm" type="button" data-act="new-apt">' + ic("plus") + "New</button>";
    return h + "</div>";
  }

  function statusPill(s) {
    var label = { booked: "Booked", arrived: "In clinic", done: "Done", noshow: "No-show", cancelled: "Cancelled" }[s] || s;
    return '<span class="status ' + s + '"><i></i>' + label + "</span>";
  }

  function aptRow(a, opts) {
    opts = opts || {};
    var tr = S.T.treatment(a.treatmentId), doc = S.T.doctor(a.doctorId), br = S.T.branch(a.branchId);
    var h = '<div class="apt s-' + a.status + (a.status === "done" || a.status === "cancelled" ? " is-done" : "") + '" data-apt="' + a.id + '">';
    h += '<div class="when num">' + U.pretty(a.time).replace(/ (AM|PM)/, "<small>$1</small>") + "</div>";
    h += '<div class="stripe"></div>';
    h += '<div class="who"><div class="nm">' + esc(a.name) + "</div>" +
      '<div class="meta"><span>' + esc(tr ? tr.name : "—") + "</span>" +
      '<span class="dotsep"></span><span>' + esc(doc ? doc.short : "—") + "</span>" +
      (opts.showBranch ? '<span class="dotsep"></span><span>' + esc(br ? br.name : "") + "</span>" : "") +
      (a.isNew ? '<span class="tagchip new">New</span>' : "") +
      (a.source === "online" ? '<span class="tagchip web">Online</span>' : "") +
      "</div></div>";
    h += statusPill(a.status);
    h += '<div class="acts">';
    if (a.status === "booked") {
      h += '<button class="act warn" type="button" data-set="arrived" data-id="' + a.id + '">' + ic("check") + '<span class="lbl">Arrived</span></button>';
      h += '<button class="act stop" type="button" data-set="noshow" data-id="' + a.id + '">' + ic("x") + '<span class="lbl">No-show</span></button>';
    } else if (a.status === "arrived") {
      h += '<button class="act go" type="button" data-set="done" data-id="' + a.id + '">' + ic("check") + '<span class="lbl">Finish</span></button>';
    } else {
      h += '<button class="act icon" type="button" data-set="booked" data-id="' + a.id + '" title="Reopen">' + ic("undo") + "</button>";
    }
    h += '<button class="act icon" type="button" data-wa="' + a.id + '" title="WhatsApp">' + ic("chat") + "</button>";
    h += '<button class="act icon" type="button" data-open="' + a.id + '" title="Open">' + ic("chevR") + "</button>";
    h += "</div></div>";
    return h;
  }

  function stToday() {
    var todayISO = U.iso(S.today());
    var rows = visible().filter(function (a) { return a.date === todayISO; })
      .sort(function (x, y) { return x.time.localeCompare(y.time); });

    var booked = rows.filter(function (a) { return a.status === "booked"; }).length;
    var here = rows.filter(function (a) { return a.status === "arrived"; }).length;
    var done = rows.filter(function (a) { return a.status === "done"; }).length;
    var gone = rows.filter(function (a) { return a.status === "noshow"; }).length;
    var revenue = rows.filter(function (a) { return a.status === "done"; })
      .reduce(function (s, a) { var tr = S.T.treatment(a.treatmentId); return s + (tr ? tr.value : 0); }, 0);

    var h = '<div class="stats">' +
      '<div class="stat"><div class="k">Still to come</div><div class="v num">' + booked + '</div><div class="s">booked today</div></div>' +
      '<div class="stat wait"><div class="k">In the clinic</div><div class="v num">' + here + '</div><div class="s">waiting or in chair</div></div>' +
      '<div class="stat ok"><div class="k">Finished</div><div class="v num">' + done + '</div><div class="s">' + money(revenue) + ' treated</div></div>' +
      '<div class="stat miss"><div class="k">Did not turn up</div><div class="v num">' + gone + '</div><div class="s">chase these today</div></div>' +
      "</div>";

    var upcoming = rows.filter(function (a) { return a.status === "booked" || a.status === "arrived"; });
    var finished = rows.filter(function (a) { return a.status !== "booked" && a.status !== "arrived"; });

    h += '<section class="panel"><header><h2>' + dayName(todayISO, true) + ", " +
      U.parseISO(todayISO).getDate() + " " + monName(todayISO) + "</h2>" +
      '<span class="sub">' + upcoming.length + ' still to see</span><span class="spacer"></span>' +
      '<button class="btn quiet sm" type="button" data-act="new-apt">' + ic("plus") + "Walk-in</button></header>";
    h += '<div class="body">';
    if (!upcoming.length) {
      h += '<div class="empty">' + ic("check") + '<span class="t">All clear</span><p>Every appointment today has been seen.</p></div>';
    } else {
      upcoming.forEach(function (a) { h += aptRow(a, { showBranch: app.st.branch === "all" }); });
    }
    h += "</div></section>";

    if (finished.length) {
      h += '<section class="panel"><header><h2>Earlier today</h2><span class="sub">' +
        finished.length + ' closed</span></header><div class="body">';
      finished.forEach(function (a) { h += aptRow(a, { showBranch: app.st.branch === "all" }); });
      h += "</div></section>";
    }
    return h;
  }

  function stCalendar() {
    var st = app.st;
    var base = st.calDate || U.iso(S.today());
    var h = '<section class="panel"><header>' +
      '<button class="iconbtn" type="button" data-cal="-1">' + ic("chevL") + "</button>" +
      "<h2>" + (st.calMode === "day"
        ? dayName(base, true) + ", " + U.parseISO(base).getDate() + " " + monName(base)
        : "Week of " + U.parseISO(base).getDate() + " " + monName(base)) + "</h2>" +
      '<button class="iconbtn" type="button" data-cal="1">' + ic("chevR") + "</button>" +
      '<span class="spacer"></span>' +
      '<div class="segment"><button type="button" data-calmode="day" aria-pressed="' + (st.calMode === "day") + '">Day</button>' +
      '<button type="button" data-calmode="week" aria-pressed="' + (st.calMode === "week") + '">Week</button></div>' +
      '<button class="btn quiet sm" type="button" data-cal="0">Today</button></header>';

    if (st.calMode === "day") {
      var docs = C.doctors.filter(function (d) {
        return st.branch === "all" || d.branches.indexOf(st.branch) !== -1;
      });
      var wins = S.windowsFor(base);
      if (!wins) {
        h += '<div class="empty">' + ic("calendar") + '<span class="t">Closed</span><p>The clinic does not open on Sundays.</p></div></section>';
        return h;
      }
      var cols = "76px repeat(" + docs.length + ", minmax(150px, 1fr))";
      h += '<div class="cal"><div class="calhead" style="grid-template-columns:' + cols + '">';
      h += "<div></div>";
      docs.forEach(function (d) {
        h += "<div>" + esc(d.short) + "<small>" + esc(d.role) + "</small></div>";
      });
      h += '</div><div class="calgrid" style="grid-template-columns:' + cols + '">';

      var rowsAt = {};
      visible().forEach(function (a) {
        if (a.date !== base) return;
        var k = a.doctorId + "|" + a.time.slice(0, 2) + ":" + (+a.time.slice(3) < 30 ? "00" : "30");
        (rowsAt[k] = rowsAt[k] || []).push(a);
      });

      wins.forEach(function (w) {
        for (var m = U.minutesOf(w[0]); m < U.minutesOf(w[1]); m += 30) {
          var label = U.hhmmOf(m);
          h += '<div class="calcell time">' + U.pretty(label) + "</div>";
          docs.forEach(function (d) {
            var list = rowsAt[d.id + "|" + label] || [];
            h += '<div class="calcell">';
            list.forEach(function (a) {
              var tr = S.T.treatment(a.treatmentId);
              h += '<button class="calchip s-' + a.status + '" type="button" data-open="' + a.id + '">' +
                "<b>" + esc(a.name) + "</b><span>" + esc(tr ? tr.name : "") + "</span></button>";
            });
            h += "</div>";
          });
        }
      });
      h += "</div></div>";
    } else {
      var start = U.parseISO(base);
      start = U.addDays(start, -((start.getDay() + 6) % 7)); // Monday
      var days = [];
      for (var i = 0; i < 6; i++) days.push(U.iso(U.addDays(start, i)));
      var colsW = "76px repeat(6, minmax(120px, 1fr))";
      h += '<div class="cal"><div class="calhead" style="grid-template-columns:' + colsW + '"><div></div>';
      days.forEach(function (dISO) {
        var n = visible().filter(function (a) { return a.date === dISO && a.status !== "cancelled"; }).length;
        h += "<div>" + dayName(dISO) + " " + U.parseISO(dISO).getDate() +
          "<small>" + n + " booked</small></div>";
      });
      h += '</div><div class="calgrid" style="grid-template-columns:' + colsW + '">';
      [["10:00", "13:00"], ["18:00", "21:00"]].forEach(function (w) {
        for (var m = U.minutesOf(w[0]); m < U.minutesOf(w[1]); m += 60) {
          var lb = U.hhmmOf(m);
          h += '<div class="calcell time">' + U.pretty(lb) + "</div>";
          days.forEach(function (dISO) {
            var list = visible().filter(function (a) {
              return a.date === dISO && U.minutesOf(a.time) >= m && U.minutesOf(a.time) < m + 60;
            });
            h += '<div class="calcell">';
            list.slice(0, 3).forEach(function (a) {
              h += '<button class="calchip s-' + a.status + '" type="button" data-open="' + a.id + '">' +
                "<b>" + esc(a.name.split(" ")[0]) + '</b><span class="num">' + U.pretty(a.time) + "</span></button>";
            });
            if (list.length > 3) h += '<span class="calchip"><span>+' + (list.length - 3) + " more</span></span>";
            h += "</div>";
          });
        }
      });
      h += "</div></div>";
    }
    return h + "</section>";
  }

  function stPatients() {
    var q = app.st.q.trim().toLowerCase();
    var all = S.patients().filter(function (p) {
      if (app.st.branch !== "all" && p.branchId !== app.st.branch) return false;
      if (!q) return true;
      return p.name.toLowerCase().indexOf(q) !== -1 || p.phone.indexOf(q) !== -1;
    });

    var h = '<section class="panel"><header><h2>Patient records</h2>' +
      '<span class="sub">' + all.length + (q ? " matching" : " on file") + "</span></header>" +
      '<div class="body"><div class="plist" id="plist">';
    if (!all.length) {
      h += '<div class="empty">' + ic("search") + '<span class="t">Nobody found</span><p>Try a different name or number.</p></div>';
    } else {
      all.slice(0, 80).forEach(function (p, i) {
        h += '<button class="prow" type="button" data-pat="' + esc(p.phone) + '">' +
          '<span class="avatar">' + esc(initials(p.name)) + "</span>" +
          '<span><span class="nm">' + esc(p.name) + "</span>" +
          '<span class="meta num">+91 ' + esc(p.phone) + "</span></span>" +
          '<span class="right"><span class="big num">' + p.visits + " visit" + (p.visits === 1 ? "" : "s") + "</span>" +
          '<span class="small">' + (p.next ? "next " + niceDate(p.next) : (p.last ? "last " + niceDate(p.last) : "—")) + "</span></span>" +
          "</button>";
      });
    }
    return h + "</div></div></section>";
  }

  function stRecall() {
    var rows = S.recalls().filter(function (r) {
      return app.st.branch === "all" || r.branchId === app.st.branch;
    });
    var due = rows.filter(function (r) { return r.overdueBy >= 0; });
    var soon = rows.filter(function (r) { return r.overdueBy < 0; });
    var atRisk = due.reduce(function (s, r) { return s + r.value; }, 0);
    var callList = due.slice(0, 8);

    var h = '<div class="recall-head">' +
      '<span class="ic">' + ic("bell") + "</span>" +
      "<div><h2>Call these " + callList.length + " patients today</h2>" +
      "<p>Treatment started, never finished. Nobody is chasing them.</p></div>" +
      '<div class="amt"><div class="v num">' + money(atRisk) + '</div><div class="k">sitting unfinished</div></div></div>';

    h += '<section class="panel"><header><h2>Overdue now</h2>' +
      '<span class="sub">' + due.length + ' patients</span><span class="spacer"></span>' +
      '<button class="btn quiet sm" type="button" data-act="recall-all">' + ic("chat") + 'Message all 8</button></header><div class="body">';

    if (!due.length) {
      h += '<div class="empty">' + ic("check") + '<span class="t">Nothing overdue</span><p>Every patient is either booked in or up to date.</p></div>';
    } else {
      due.slice(0, 40).forEach(function (r) {
        var doc = S.T.doctor(r.doctorId);
        h += '<div class="rrow' + (r.handled ? " hushed" : "") + '">' +
          '<span class="avatar">' + esc(initials(r.name)) + "</span>" +
          '<div><div class="nm">' + esc(r.name) + "</div>" +
          '<div class="meta">' + esc(r.treatment) + " with " + esc(doc ? doc.short : "—") +
          " · last seen " + gapWords(U.daysBetween(U.parseISO(r.lastVisit), S.today())) + " ago</div></div>" +
          '<span class="overdue' + (r.overdueBy > 21 ? "" : " soon") + '">' +
          (r.overdueBy === 0 ? "Due today" : gapWords(r.overdueBy) + " overdue") + "</span>" +
          '<span class="val num">' + money(r.value) + "<small>at stake</small></span>" +
          '<span class="acts">' +
          '<button class="act go" type="button" data-recall-wa="' + r.id + '">' + ic("chat") + '<span class="lbl">WhatsApp</span></button>' +
          '<button class="act icon" type="button" data-recall-done="' + r.id + '" title="Mark handled">' + ic("check") + "</button>" +
          "</span></div>";
      });
    }
    h += "</div></section>";

    if (soon.length) {
      h += '<section class="panel"><header><h2>Coming up this week</h2>' +
        '<span class="sub">' + soon.length + ' patients</span></header><div class="body">';
      soon.slice(0, 12).forEach(function (r) {
        h += '<div class="rrow"><span class="avatar">' + esc(initials(r.name)) + "</span>" +
          '<div><div class="nm">' + esc(r.name) + '</div><div class="meta">' + esc(r.treatment) +
          " · due " + niceDate(r.dueOn) + "</div></div>" +
          '<span class="val num">' + money(r.value) + "<small>at stake</small></span></div>";
      });
      h += "</div></section>";
    }
    return h;
  }

  function stReports() {
    var rows = visible();
    var today = S.today();
    var last30 = rows.filter(function (a) {
      var d = U.parseISO(a.date);
      return d <= today && U.daysBetween(d, today) <= 30;
    });
    var doneN = last30.filter(function (a) { return a.status === "done"; }).length;
    var noshowN = last30.filter(function (a) { return a.status === "noshow"; }).length;
    var total = doneN + noshowN || 1;
    var rate = Math.round((noshowN / total) * 100);
    var online = last30.filter(function (a) { return a.source === "online"; }).length;
    var revenue = last30.filter(function (a) { return a.status === "done"; })
      .reduce(function (s, a) { var tr = S.T.treatment(a.treatmentId); return s + (tr ? tr.value : 0); }, 0);

    var h = '<div class="stats">' +
      '<div class="stat ok"><div class="k">Treated · 30 days</div><div class="v num">' + doneN + '</div><div class="s">' + money(revenue) + " billed</div></div>" +
      '<div class="stat miss"><div class="k">No-show rate</div><div class="v num">' + rate + '%</div><div class="s">' + noshowN + " missed slots</div></div>" +
      '<div class="stat"><div class="k">Booked online</div><div class="v num">' + Math.round((online / (last30.length || 1)) * 100) + '%</div><div class="s">without a phone call</div></div>' +
      '<div class="stat wait"><div class="k">Recall pending</div><div class="v num">' + S.recalls().filter(function (r) { return r.overdueBy >= 0; }).length + '</div><div class="s">waiting to be called</div></div>' +
      "</div>";

    /* last 7 days bar chart */
    var week = [];
    for (var i = 6; i >= 0; i--) {
      var dISO = U.iso(U.addDays(today, -i));
      week.push({ d: dISO, n: rows.filter(function (a) { return a.date === dISO && a.status !== "cancelled"; }).length });
    }
    var peak = Math.max.apply(null, week.map(function (w) { return w.n; })) || 1;

    h += '<div class="repgrid">';
    h += '<section class="panel"><header><h2>Appointments this week</h2></header><div class="body pad">' +
      '<div class="week">';
    week.forEach(function (w, i) {
      var isToday = i === 6;
      h += '<div class="col"><span class="vn num">' + w.n + "</span>" +
        '<span class="stalk' + (isToday ? " today" : "") + '" style="height:' + Math.max(4, (w.n / peak) * 92) + '%"></span>' +
        '<span class="cap">' + dayName(w.d) + "</span></div>";
    });
    h += "</div></div></section>";

    /* treatments */
    var byTreat = {};
    last30.forEach(function (a) {
      if (a.status !== "done") return;
      byTreat[a.treatmentId] = (byTreat[a.treatmentId] || 0) + 1;
    });
    var tlist = Object.keys(byTreat).map(function (k) {
      return { id: k, n: byTreat[k], name: (S.T.treatment(k) || {}).name || k };
    }).sort(function (a, b) { return b.n - a.n; }).slice(0, 7);
    var tmax = tlist.length ? tlist[0].n : 1;

    h += '<section class="panel"><header><h2>Most common treatments</h2><span class="sub">last 30 days</span></header>' +
      '<div class="body pad"><div class="bars">';
    tlist.forEach(function (r) {
      h += '<div class="bar"><span class="lb">' + esc(r.name) + "</span>" +
        '<span class="tk"><i style="width:' + Math.round((r.n / tmax) * 100) + '%"></i></span>' +
        '<span class="vn num">' + r.n + "</span></div>";
    });
    h += "</div></div></section>";

    /* where bookings come from */
    var srcOnline = last30.filter(function (a) { return a.source === "online"; }).length;
    var srcPhone = last30.length - srcOnline;
    var smax = Math.max(srcOnline, srcPhone) || 1;
    h += '<section class="panel"><header><h2>Where bookings come from</h2></header><div class="body pad"><div class="bars">' +
      '<div class="bar"><span class="lb">Website / online</span><span class="tk"><i class="teal" style="width:' +
      Math.round((srcOnline / smax) * 100) + '%"></i></span><span class="vn num">' + srcOnline + "</span></div>" +
      '<div class="bar"><span class="lb">Phone / walk-in</span><span class="tk"><i style="width:' +
      Math.round((srcPhone / smax) * 100) + '%"></i></span><span class="vn num">' + srcPhone + "</span></div>" +
      "</div></div></section>";

    /* per branch */
    h += '<section class="panel"><header><h2>By branch</h2><span class="sub">last 30 days</span></header><div class="body pad"><div class="bars">';
    var bmax = 1;
    C.branches.forEach(function (b) {
      var n = S.appointments.filter(function (a) {
        var d = U.parseISO(a.date);
        return a.branchId === b.id && d <= today && U.daysBetween(d, today) <= 30;
      }).length;
      bmax = Math.max(bmax, n);
      b._n = n;
    });
    C.branches.forEach(function (b) {
      h += '<div class="bar"><span class="lb">' + esc(b.name) + '</span><span class="tk"><i style="width:' +
        Math.round((b._n / bmax) * 100) + '%"></i></span><span class="vn num">' + b._n + "</span></div>";
    });
    h += "</div></div></section>";

    return h + "</div>";
  }

  function stSettings() {
    var h = '<div class="setgrid">';

    h += '<section class="panel"><header><h2>Opening hours</h2><span class="sub">Bookings can only land inside these windows</span></header><div class="body">';
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach(function (nm, i) {
      var day = (i + 1) % 7;
      var w = C.hours[day];
      h += '<div class="srowline"><span class="lb">' + nm + "</span>";
      if (!w) h += '<span class="vl" style="color:var(--rose)">Closed</span>';
      else h += w.map(function (r) {
        return '<span class="timebox">' + U.pretty(r[0]) + " – " + U.pretty(r[1]) + "</span>";
      }).join(" ");
      h += "</div>";
    });
    h += "</div></section>";

    h += '<section class="panel"><header><h2>Doctors</h2><span class="sub">Who can be booked, and where</span></header><div class="body">';
    C.doctors.forEach(function (d) {
      h += '<div class="srowline"><span class="avatar">' + esc(initials(d.name)) + "</span>" +
        '<span><span class="lb" style="display:block">' + esc(d.name) + "</span>" +
        '<span class="vl" style="font-size:12.5px;color:var(--muted)">' + esc(d.role) + "</span></span>" +
        '<span class="right">' + d.branches.map(function (b) {
          return '<span class="tagchip">' + esc((S.T.branch(b) || {}).name || b) + "</span>";
        }).join(" ") + "</span></div>";
    });
    h += "</div></section>";

    h += '<section class="panel"><header><h2>Treatments</h2><span class="sub">Length decides how slots are cut · recall decides when we chase</span></header><div class="body">';
    C.categories.forEach(function (cat) {
      var items = S.T.inCategory(cat.id);
      if (!items.length) return;
      h += '<div class="grouphead eyebrow">' + esc(cat.name) + '</div>';
      items.forEach(function (tr) {
        h += '<div class="srowline"><span class="lb" style="min-width:208px">' + esc(tr.name) + "</span>" +
          '<span class="timebox">' + ic("clock") + tr.mins + " min</span>" +
          '<span class="right vl">' + (tr.recallDays ? "Recall after " + gapWords(tr.recallDays) : "No recall") + "</span></div>";
      });
    });
    h += "</div></section>";

    h += '<section class="panel"><header><h2>Automatic messages</h2><span class="sub">Sent on WhatsApp, no staff action needed</span></header><div class="body">';
    [["Booking confirmation", "The moment a slot is taken", true],
     ["Reminder — 24 hours before", "With confirm and reschedule buttons", true],
     ["Reminder — 2 hours before", "Short nudge on the day", true],
     ["No-show follow-up", "Same evening, offers a new slot", true],
     ["Recall message", "When a treatment is overdue", true],
     ["Google review request", "After a finished visit", false]].forEach(function (r, i) {
      h += '<div class="srowline"><span><span class="lb" style="display:block">' + r[0] + "</span>" +
        '<span class="vl" style="font-size:12.5px;color:var(--muted)">' + r[1] + "</span></span>" +
        '<span class="right"><button class="switch" type="button" data-toggle="' + i + '" aria-pressed="' + r[2] + '" aria-label="' + esc(r[0]) + '"></button></span></div>';
    });
    h += "</div></section>";

    h += '<section class="panel"><header><h2>Message wording</h2><span class="sub">Blue words fill in by themselves</span></header><div class="body pad" style="display:grid;gap:12px">';
    [["Confirmation", C.templates.confirm], ["Reminder", C.templates.remind24], ["Recall", C.templates.recall]].forEach(function (r) {
      h += '<div><div class="eyebrow" style="margin-bottom:6px">' + r[0] + "</div>" +
        '<div class="tpl">' + esc(r[1]).replace(/\{(\w+)\}/g, '<span class="var">$1</span>') + "</div></div>";
    });
    h += "</div></section>";

    return h + "</div>";
  }

  function renderStaff() {
    var body = app.st.tab === "today" ? stToday()
             : app.st.tab === "calendar" ? stCalendar()
             : app.st.tab === "patients" ? stPatients()
             : app.st.tab === "recall" ? stRecall()
             : app.st.tab === "reports" ? stReports()
             : stSettings();
    return '<div class="st">' + stNav() +
      '<div class="work">' + stTop() + '<div class="sheet">' + body + "</div></div></div>";
  }

  /* ---------- drawer: one appointment ----------------------------- */

  function drawerHTML() {
    var id = app.st.drawer;
    if (!id) return "";
    var a = S.find(id);
    if (!a) return "";
    var tr = S.T.treatment(a.treatmentId), doc = S.T.doctor(a.doctorId), br = S.T.branch(a.branchId);
    var history = S.appointments.filter(function (x) { return x.phone === a.phone; })
      .sort(function (x, y) { return y.date.localeCompare(x.date); });

    var h = '<div class="scrim" data-close="1"></div><aside class="drawer" role="dialog" aria-label="Appointment">' +
      '<header><span class="avatar">' + esc(initials(a.name)) + "</span>" +
      "<div><h2>" + esc(a.name) + '</h2><div class="sub num" style="font-size:12.5px;color:var(--muted)">+91 ' + esc(a.phone) + "</div></div>" +
      '<span class="spacer"></span><button class="iconbtn" type="button" data-close="1" aria-label="Close">' + ic("x") + "</button></header>";

    h += '<div class="scroll">';
    h += '<div class="summary">' +
      '<div class="srow"><dt>Status</dt><dd>' + statusPill(a.status) + "</dd></div>" +
      '<div class="srow"><dt>Reference</dt><dd class="num">' + esc(a.code || "—") + "</dd></div>" +
      '<div class="srow"><dt>Day</dt><dd>' + niceDate(a.date) + "</dd></div>" +
      '<div class="srow"><dt>Time</dt><dd class="num">' + U.pretty(a.time) + " · " + a.mins + " min</dd></div>" +
      '<div class="srow"><dt>Treatment</dt><dd>' + esc(tr ? tr.name : "—") + "</dd></div>" +
      '<div class="srow"><dt>Doctor</dt><dd>' + esc(doc ? doc.name : "—") + "</dd></div>" +
      '<div class="srow"><dt>Clinic</dt><dd>' + esc(br ? br.name : "—") + "</dd></div>" +
      '<div class="srow"><dt>Booked via</dt><dd>' + (a.source === "online" ? "Website" : "Phone / walk-in") + "</dd></div>" +
      "</div>";

    if (a.notes) {
      h += '<div><div class="eyebrow" style="margin-bottom:6px">Patient note</div><div class="tpl">' + esc(a.notes) + "</div></div>";
    }

    h += '<div><div class="eyebrow" style="margin-bottom:8px">Visit history · ' + history.length + "</div>";
    history.slice(0, 8).forEach(function (x) {
      var xt = S.T.treatment(x.treatmentId);
      h += '<div class="srowline" style="padding-left:0;padding-right:0">' +
        '<span class="lb" style="min-width:92px">' + niceDate(x.date) + "</span>" +
        '<span class="vl">' + esc(xt ? xt.name : "—") + "</span>" +
        '<span class="right">' + statusPill(x.status) + "</span></div>";
    });
    h += "</div></div>";

    h += "<footer>";
    if (a.status === "booked") {
      h += '<button class="btn quiet sm" type="button" data-set="arrived" data-id="' + a.id + '">' + ic("check") + "Arrived</button>";
      h += '<button class="btn quiet sm" type="button" data-set="noshow" data-id="' + a.id + '">' + ic("x") + "No-show</button>";
    } else if (a.status === "arrived") {
      h += '<button class="btn primary sm" type="button" data-set="done" data-id="' + a.id + '">' + ic("check") + "Finish visit</button>";
    }
    h += '<span style="flex:1"></span>' +
      '<button class="btn primary sm" type="button" data-wa="' + a.id + '">' + ic("chat") + "WhatsApp</button></footer></aside>";
    return h;
  }

  /* ---------- modal: new appointment ------------------------------ */

  var newApt = { branchId: null, catId: null, treatmentId: null, date: null, slot: null, name: "", phone: "" };

  function modalHTML() {
    if (app.st.modal !== "new") return "";
    var m = newApt;
    var h = '<div class="scrim" data-close="1"></div><div class="modal" role="dialog" aria-label="New appointment">' +
      "<header><h2>New appointment</h2><span class=\"sub\" style=\"font-size:12.5px;color:var(--muted)\">Phone or walk-in</span>" +
      '<span class="spacer"></span><button class="iconbtn" type="button" data-close="1" aria-label="Close">' + ic("x") + "</button></header>";
    h += '<div class="scroll">';

    h += '<div class="field"><label>Clinic</label><div class="pills">';
    C.branches.forEach(function (b) {
      h += '<button class="pill" type="button" data-nbranch="' + b.id + '" aria-pressed="' + (m.branchId === b.id) + '">' + esc(b.name) + "</button>";
    });
    h += "</div></div>";

    if (m.branchId) {
      h += '<div class="field"><label>Department</label><div class="pills">';
      C.categories.forEach(function (cat) {
        if (!S.T.inCategory(cat.id, m.branchId).length) return;
        h += '<button class="pill" type="button" data-ncat="' + cat.id + '" aria-pressed="' +
          (m.catId === cat.id) + '">' + esc(cat.name) + '</button>';
      });
      h += "</div></div>";
    }
    if (m.catId) {
      h += '<div class="field"><label>Treatment</label><div class="pills">';
      S.T.inCategory(m.catId, m.branchId).forEach(function (tr) {
        h += '<button class="pill" type="button" data-ntreat="' + tr.id + '" aria-pressed="' +
          (m.treatmentId === tr.id) + '">' + esc(tr.name) + ' · ' + tr.mins + 'm</button>';
      });
      h += "</div></div>";
    }

    if (m.branchId && m.treatmentId) {
      h += '<div class="field"><label>Day</label><div class="datestrip">';
      for (var i = 0; i < 10; i++) {
        var d = U.addDays(S.today(), i), dISO = U.iso(d);
        var open = S.isOpen(dISO);
        var free = open ? S.freeSlots(dISO, m.branchId, m.treatmentId).length : 0;
        h += '<button class="daybtn" type="button" data-ndate="' + dISO + '" aria-pressed="' + (m.date === dISO) + '"' +
          (free ? "" : " disabled") + ">" +
          '<span class="dow">' + (i === 0 ? "Today" : dayName(dISO)) + '</span><span class="dd num">' + d.getDate() +
          '</span><span class="mon">' + monName(dISO) + '</span><span class="free">' + (open ? free + " free" : "closed") + "</span></button>";
      }
      h += "</div></div>";
    }

    if (m.date) {
      var slots = S.freeSlots(m.date, m.branchId, m.treatmentId);
      h += '<div class="field"><label>Time</label><div class="slots">';
      slots.forEach(function (s) {
        var on = m.slot && m.slot.time === s.time && m.slot.doctorId === s.doctorId;
        h += '<button class="slot" type="button" data-nslot="' + s.time + "|" + s.doctorId + '" aria-pressed="' + on + '">' +
          '<span class="tm num">' + U.pretty(s.time) + '</span><span class="dr">' + esc(s.doctorShort) + "</span></button>";
      });
      h += "</div></div>";
    }

    h += '<div class="field"><label for="n-name">Patient name</label>' +
      '<input class="input" id="n-name" type="text" placeholder="Full name" value="' + esc(m.name) + '"></div>';
    h += '<div class="field"><label for="n-phone">Mobile number</label>' +
      '<div class="phonewrap"><span class="cc">+91</span><input class="input" id="n-phone" type="tel" ' +
      'inputmode="numeric" maxlength="10" placeholder="98765 43210" value="' + esc(m.phone) + '"></div></div>';

    h += "</div><footer><span style=\"flex:1\"></span>" +
      '<button class="btn ghost sm" type="button" data-close="1">Cancel</button>' +
      '<button class="btn primary sm" type="button" data-act="save-apt"' +
      (m.slot && m.name.trim() ? "" : " disabled") + ">" + ic("check") + "Book it</button></footer></div>";
    return h;
  }

  /* ---------- command palette ------------------------------------- */

  function cmdItems() {
    var q = app.st.cmdQ.trim().toLowerCase();
    var out = [];
    var tabs = [["today", "home", "Today"], ["calendar", "calendar", "Calendar"],
                ["patients", "users", "Patients"], ["recall", "bell", "Recall list"],
                ["reports", "chart", "Reports"], ["settings", "settings", "Settings"]];
    tabs.forEach(function (tb) {
      if (!q || tb[2].toLowerCase().indexOf(q) !== -1) {
        out.push({ kind: "tab", id: tb[0], icon: tb[1], name: tb[2], meta: "Go to section" });
      }
    });
    if (q) {
      S.patients().filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1 || p.phone.indexOf(q) !== -1;
      }).slice(0, 8).forEach(function (p) {
        out.push({ kind: "patient", id: p.phone, icon: "users", name: p.name,
                   meta: "+91 " + p.phone + " · " + p.visits + " visits" });
      });
    }
    return out.slice(0, 12);
  }

  function cmdHTML() {
    if (!app.st.cmd) return "";
    var items = cmdItems();
    var h = '<div class="scrim" data-close="1"></div><div class="cmdk" role="dialog" aria-label="Search">' +
      "<header>" + ic("search") +
      '<input id="cmd-input" type="text" placeholder="Search patients, jump anywhere…" value="' + esc(app.st.cmdQ) + '" autocomplete="off"></header>' +
      '<div class="results">';
    if (!items.length) {
      h += '<div class="empty">' + ic("search") + "<p>Nothing matches.</p></div>";
    } else {
      items.forEach(function (it, i) {
        h += '<button class="cmdres" type="button" data-cmd="' + it.kind + ":" + esc(it.id) + '" data-active="' + (i === app.st.cmdIdx) + '">' +
          ic(it.icon) + '<span><span class="nm">' + esc(it.name) + '</span><br><span class="meta">' + esc(it.meta) + "</span></span>" +
          '<span class="go">↵</span></button>';
      });
    }
    return h + "</div></div>";
  }

  /* ---------- shell ------------------------------------------------ */

  function demobar() {
    var dark = currentTheme() === "dark";
    return '<div class="demobar">' +
      '<span class="tag">Demo</span>' +
      '<span class="who">Smile and Glow · sample data, not real patients</span>' +
      '<span class="spacer"></span>' +
      '<div class="segment" role="group" aria-label="View">' +
      '<button type="button" data-view="patient" aria-pressed="' + (app.view === "patient") + '">' + ic("users") + '<span class="seglbl">Booking page</span></button>' +
      '<button type="button" data-view="reminder" aria-pressed="' + (app.view === "reminder") + '">' + ic("chat") + '<span class="seglbl">Reminder link</span></button>' +
      '<button type="button" data-view="staff" aria-pressed="' + (app.view === "staff") + '">' + ic("home") + '<span class="seglbl">Staff dashboard</span></button>' +
      "</div>" +
      '<button class="iconbtn" type="button" data-act="theme" aria-label="Switch theme">' + ic(dark ? "sun" : "moon") + "</button>" +
      "</div>";
  }

  function render() {
    var root = $("#root");
    var scroll = window.scrollY;
    root.innerHTML = demobar() +
      (app.view === "patient" ? renderPatient()
        : app.view === "reminder" ? renderReminder()
        : renderStaff()) +
      (app.view === "staff" ? drawerHTML() + modalHTML() + cmdHTML() : "");
    if (app.view === "staff") window.scrollTo(0, scroll);
    var ci = $("#cmd-input");
    if (ci) { ci.focus(); ci.setSelectionRange(ci.value.length, ci.value.length); }
  }

  /* ---------- status changes, with undo ---------------------------- */

  function setStatus(id, status) {
    var a = S.find(id);
    if (!a) return;
    var was = a.status;
    var label = { arrived: "marked in clinic", done: "visit finished",
                  noshow: "marked no-show", booked: "reopened" }[status] || "updated";
    S.patch(id, { status: status });
    render();
    toast(a.name.split(" ")[0] + " " + label, {
      icon: status === "noshow" ? "alert" : "check",
      undo: function () { S.patch(id, { status: was }); render(); }
    });
  }

  function waLink(phone, text) {
    return "https://wa.me/91" + String(phone).replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
  }

  function sendWhatsApp(a) {
    var tr = S.T.treatment(a.treatmentId), br = S.T.branch(a.branchId), doc = S.T.doctor(a.doctorId);
    var msg = C.templates.confirm
      .replace("{name}", a.name.split(" ")[0]).replace("{branch}", br ? br.name : "")
      .replace("{date}", niceDate(a.date)).replace("{time}", U.pretty(a.time))
      .replace("{treatment}", tr ? tr.name : "").replace("{doctor}", doc ? doc.short : "");
    window.open(waLink(a.phone, msg), "_blank", "noopener");
    toast("WhatsApp opened for " + a.name.split(" ")[0]);
  }

  /* ---------- events ----------------------------------------------- */

  document.addEventListener("click", function (ev) {
    var el = ev.target.closest ? ev.target.closest("[data-view],[data-act],[data-lang],[data-branch],[data-cat]," +
      "[data-treat],[data-date],[data-slot],[data-new],[data-tab],[data-br],[data-set],[data-open]," +
      "[data-wa],[data-close],[data-pat],[data-cal],[data-calmode],[data-toggle],[data-recall-wa]," +
      "[data-recall-done],[data-nbranch],[data-ncat],[data-ntreat],[data-ndate],[data-nslot],[data-cmd]," +
      "[data-rm],[data-rdate],[data-rslot],[data-flag],[data-star]") : null;
    if (!el) return;
    var d = el.dataset;

    /* shell */
    if (d.view) { goTo(d.view); render(); window.scrollTo(0, 0); return; }
    if (d.act === "theme") { flipTheme(); return; }

    /* patient */
    if (d.lang) { app.lang = d.lang; render(); return; }
    if (d.branch) {
      app.pt.branchId = d.branch; app.pt.catId = null; app.pt.treatmentId = null;
      app.pt.date = null; app.pt.slot = null; ptNext(); return;
    }
    if (d.cat) {
      app.pt.catId = app.pt.catId === d.cat ? null : d.cat;
      app.pt.treatmentId = null; app.pt.date = null; app.pt.slot = null;
      render(); return;
    }
    if (d.treat) { app.pt.treatmentId = d.treat; app.pt.date = null; app.pt.slot = null; ptNext(); return; }
    if (d.date) { app.pt.date = d.date; app.pt.slot = null; render(); return; }
    if (d.slot) {
      var parts = d.slot.split("|");
      app.pt.slot = { time: parts[0], doctorId: parts[1] };
      render();
      return;
    }
    if (d.new !== undefined) { ptCapture(); app.pt.isNew = d.new === "1"; render(); return; }
    if (d.act === "next") { ptCapture(); ptNext(); return; }
    if (d.act === "back") { ptCapture(); app.pt.step = Math.max(1, app.pt.step - 1); render(); return; }
    if (d.act === "submit") { ptSubmit(); return; }
    if (d.act === "restart") {
      app.pt = { step: 1, branchId: null, catId: null, treatmentId: null, date: null, slot: null,
                 name: "", phone: "", email: "", isNew: null, notes: "", errors: {}, booked: null };
      render(); window.scrollTo(0, 0); return;
    }

    /* reminder link */
    if (d.rdate) { app.rm.date = d.rdate; app.rm.slot = null; render(); return; }
    if (d.rslot) {
      var rp = d.rslot.split("|");
      app.rm.slot = { time: rp[0], doctorId: rp[1] };
      render(); return;
    }
    if (d.flag) {
      var nt = $("#rm-note"); if (nt) app.rm.note = nt.value;
      app.rm.flags[d.flag] = !app.rm.flags[d.flag];
      if (d.flag === "Nothing to declare" && app.rm.flags[d.flag]) app.rm.flags = { "Nothing to declare": true };
      else if (app.rm.flags["Nothing to declare"]) delete app.rm.flags["Nothing to declare"];
      render(); return;
    }
    if (d.star) { app.rm.rating = +d.star; render(); return; }
    if (d.rm) { reminderAction(d.rm); return; }

    /* staff */
    if (d.tab) { app.st.tab = d.tab; app.st.q = ""; render(); return; }
    if (d.br) { app.st.branch = d.br; render(); return; }
    if (d.set) { setStatus(d.id, d.set); return; }
    if (d.open) { app.st.drawer = d.open; render(); return; }
    if (d.wa) { var aw = S.find(d.wa); if (aw) sendWhatsApp(aw); return; }
    if (d.close) { app.st.drawer = null; app.st.modal = null; app.st.cmd = false; render(); return; }
    if (d.pat) {
      var mine = S.appointments.filter(function (x) { return x.phone === d.pat; })
        .sort(function (x, y) { return y.date.localeCompare(x.date); });
      if (mine.length) { app.st.drawer = mine[0].id; render(); }
      return;
    }
    if (d.cal !== undefined) {
      var cur = app.st.calDate || U.iso(S.today());
      var step = app.st.calMode === "week" ? 7 : 1;
      if (d.cal === "0") app.st.calDate = U.iso(S.today());
      else app.st.calDate = U.iso(U.addDays(U.parseISO(cur), (+d.cal) * step));
      render(); return;
    }
    if (d.calmode) { app.st.calMode = d.calmode; render(); return; }
    if (d.toggle !== undefined) {
      var on = el.getAttribute("aria-pressed") === "true";
      el.setAttribute("aria-pressed", String(!on));
      toast(on ? "Automatic message turned off" : "Automatic message turned on");
      return;
    }

    /* recall */
    if (d.recallWa) {
      var ra = S.find(d.recallWa);
      if (!ra) return;
      var rtr = S.T.treatment(ra.treatmentId), rdoc = S.T.doctor(ra.doctorId);
      var gap = gapWords(U.daysBetween(U.parseISO(ra.date), S.today()));
      var rmsg = C.templates.recall
        .replace("{name}", ra.name.split(" ")[0]).replace("{gap}", gap)
        .replace("{treatment}", rtr ? rtr.name : "treatment")
        .replace("{doctor}", rdoc ? rdoc.short.replace("Dr. ", "") : "");
      window.open(waLink(ra.phone, rmsg), "_blank", "noopener");
      S.patch(ra.id, { recallHandled: true });
      render();
      toast("Recall sent to " + ra.name.split(" ")[0], {
        icon: "chat",
        undo: function () { S.patch(ra.id, { recallHandled: false }); render(); }
      });
      return;
    }
    if (d.recallDone) {
      var rd = S.find(d.recallDone);
      S.patch(d.recallDone, { recallHandled: true });
      render();
      toast((rd ? rd.name.split(" ")[0] : "Patient") + " marked handled", {
        undo: function () { S.patch(d.recallDone, { recallHandled: false }); render(); }
      });
      return;
    }
    if (d.act === "recall-all") {
      var list = S.recalls().filter(function (r) { return r.overdueBy >= 0; }).slice(0, 8);
      list.forEach(function (r) { S.patch(r.id, { recallHandled: true }); });
      render();
      toast(list.length + " recall messages queued on WhatsApp", { icon: "chat" });
      return;
    }

    /* new appointment modal */
    if (d.act === "new-apt") {
      newApt = { branchId: app.st.branch === "all" ? C.branches[0].id : app.st.branch,
                 catId: null, treatmentId: null, date: null, slot: null, name: "", phone: "" };
      app.st.modal = "new"; render(); return;
    }
    if (d.nbranch) { newApt.branchId = d.nbranch; newApt.catId = null; newApt.treatmentId = null; newApt.date = null; newApt.slot = null; captureNew(); render(); return; }
    if (d.ncat) { captureNew(); newApt.catId = d.ncat; newApt.treatmentId = null; newApt.date = null; newApt.slot = null; render(); return; }
    if (d.ntreat) { captureNew(); newApt.treatmentId = d.ntreat; newApt.date = null; newApt.slot = null; render(); return; }
    if (d.ndate) { captureNew(); newApt.date = d.ndate; newApt.slot = null; render(); return; }
    if (d.nslot) {
      captureNew();
      var np = d.nslot.split("|");
      newApt.slot = { time: np[0], doctorId: np[1] };
      render(); return;
    }
    if (d.act === "save-apt") {
      captureNew();
      if (!newApt.slot || !newApt.name.trim()) return;
      S.book({
        date: newApt.date, time: newApt.slot.time, branchId: newApt.branchId,
        treatmentId: newApt.treatmentId, doctorId: newApt.slot.doctorId,
        name: newApt.name.trim(), phone: newApt.phone || "0000000000",
        email: "", isNew: true, notes: "", source: "phone"
      }).then(function () {
        app.st.modal = null;
        render();
        toast("Booked " + newApt.name.split(" ")[0] + " for " + niceDate(newApt.date) + " at " + U.pretty(newApt.slot.time));
      });
      return;
    }

    /* command palette */
    if (d.cmd) { runCmd(d.cmd); return; }
  });

  function reminderAction(kind) {
    var a = rmApt();
    if (!a) return;
    var r = app.rm;

    if (kind === "confirm") {
      S.patch(a.id, { confirmed: true });
      render();
      toast("Confirmed. The clinic has been told.", { icon: "check" });
      return;
    }
    if (kind === "move") { r.mode = "move"; r.date = null; r.slot = null; render(); return; }
    if (kind === "cancel-move") { r.mode = null; render(); return; }
    if (kind === "save-move") {
      if (!r.slot) return;
      var still = S.freeSlots(r.date, a.branchId, a.treatmentId).some(function (sl) {
        return sl.time === r.slot.time && sl.doctorId === r.slot.doctorId;
      });
      if (!still) { r.slot = null; render(); toast("That time just went. Please pick another.", { icon: "alert" }); return; }
      var wasDate = a.date, wasTime = a.time, wasDoc = a.doctorId;
      S.patch(a.id, { date: r.date, time: r.slot.time, doctorId: r.slot.doctorId, confirmed: true });
      r.mode = null;
      render();
      toast("Moved to " + niceDate(r.date) + ", " + U.pretty(r.slot.time), {
        undo: function () {
          S.patch(a.id, { date: wasDate, time: wasTime, doctorId: wasDoc });
          render();
        }
      });
      return;
    }
    if (kind === "drop") {
      var prev = a.status;
      S.patch(a.id, { status: "cancelled" });
      render();
      toast("Appointment cancelled. The slot is free again.", {
        icon: "alert",
        undo: function () { S.patch(a.id, { status: prev }); render(); }
      });
      return;
    }
    if (kind === "save-med") {
      var note = $("#rm-note");
      var picked = Object.keys(r.flags).filter(function (k) { return r.flags[k]; });
      S.patch(a.id, { medical: { saved: true, flags: picked, note: note ? note.value.trim() : "" } });
      render();
      toast("Sent. The doctor will read it before you arrive.", { icon: "check" });
      return;
    }
    if (kind === "edit-med") {
      var cur = a.medical || {};
      r.flags = {};
      (cur.flags || []).forEach(function (f) { r.flags[f] = true; });
      r.note = cur.note || "";
      S.patch(a.id, { medical: null });
      render();
      return;
    }
    if (kind === "review") {
      S.patch(a.id, { feedback: { rating: r.rating } });
      window.open("https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(C.name + " dental " + (S.T.branch(a.branchId) || {}).area), "_blank", "noopener");
      render();
      toast("Thank you. Google opened in a new tab.", { icon: "star" });
      return;
    }
    if (kind === "skip-review") {
      S.patch(a.id, { feedback: { rating: r.rating } });
      render();
      toast("Thank you for the rating.");
      return;
    }
    if (kind === "send-fb") {
      var fb = $("#rm-fb");
      S.patch(a.id, { feedback: { rating: r.rating, note: fb ? fb.value.trim() : "" } });
      render();
      toast("Sent straight to the owner. Thank you for being honest.", { icon: "chat" });
      return;
    }
    if (kind === "next-apt") {
      app.rm.aptId = null;
      app.rm.mode = null;
      var found = rmApt();
      render();
      if (!found || found.status === "cancelled") toast("No other appointments booked.", { icon: "calendar" });
      return;
    }
    if (kind === "rebook") {
      goTo("patient");
      app.pt.booked = null; app.pt.step = 1;
      render(); window.scrollTo(0, 0);
      return;
    }
  }

  /* The modal's save button lives outside the field being typed in, so
     re-evaluate it on each keystroke instead of re-rendering (which
     would steal focus mid-word). */
  function syncSaveBtn() {
    var btn = $('[data-act="save-apt"]');
    if (btn) btn.disabled = !(newApt.slot && newApt.name.trim());
  }

  function captureNew() {
    var n = $("#n-name"), p = $("#n-phone");
    if (n) newApt.name = n.value;
    if (p) newApt.phone = p.value.replace(/\D/g, "").slice(0, 10);
  }

  function runCmd(token) {
    var parts = token.split(":");
    app.st.cmd = false;
    app.st.cmdQ = "";
    if (parts[0] === "tab") { app.st.tab = parts[1]; render(); return; }
    if (parts[0] === "patient") {
      var mine = S.appointments.filter(function (x) { return x.phone === parts[1]; })
        .sort(function (x, y) { return y.date.localeCompare(x.date); });
      app.st.tab = "patients";
      if (mine.length) app.st.drawer = mine[0].id;
      render(); return;
    }
    render();
  }

  /* live-typing inputs that must not trigger a full re-render */
  document.addEventListener("input", function (ev) {
    var id = ev.target.id;
    if (id === "st-search") {
      app.st.q = ev.target.value;
      if (app.st.tab !== "patients") { app.st.tab = "patients"; render(); $("#st-search").focus(); return; }
      var host = $("#plist");
      if (host) {
        var tmp = document.createElement("div");
        tmp.innerHTML = stPatients();
        var fresh = $("#plist", tmp);
        if (fresh) host.innerHTML = fresh.innerHTML;
      }
      return;
    }
    if (id === "cmd-input") {
      app.st.cmdQ = ev.target.value;
      app.st.cmdIdx = 0;
      var box = $(".cmdk .results");
      if (box) {
        var t2 = document.createElement("div");
        t2.innerHTML = cmdHTML();
        box.innerHTML = $(".results", t2).innerHTML;
      }
      return;
    }
    if (id === "f-name") app.pt.name = ev.target.value;
    if (id === "f-phone") {
      ev.target.value = ev.target.value.replace(/\D/g, "").slice(0, 10);
      app.pt.phone = ev.target.value;
    }
    if (id === "f-email") app.pt.email = ev.target.value;
    if (id === "f-notes") app.pt.notes = ev.target.value;
    if (id === "rm-note") app.rm.note = ev.target.value;
    if (id === "n-name") { newApt.name = ev.target.value; syncSaveBtn(); }
    if (id === "n-phone") {
      ev.target.value = ev.target.value.replace(/\D/g, "").slice(0, 10);
      newApt.phone = ev.target.value;
    }
  });

  document.addEventListener("keydown", function (ev) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);

    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
      ev.preventDefault();
      goTo("staff");
      app.st.cmd = true; app.st.cmdQ = ""; app.st.cmdIdx = 0;
      render(); return;
    }
    if (ev.key === "Escape") {
      if (app.st.cmd || app.st.drawer || app.st.modal) {
        app.st.cmd = false; app.st.drawer = null; app.st.modal = null; render();
      }
      return;
    }
    if (app.st.cmd) {
      var items = cmdItems();
      if (ev.key === "ArrowDown") { ev.preventDefault(); app.st.cmdIdx = Math.min(items.length - 1, app.st.cmdIdx + 1); paintCmdActive(); }
      if (ev.key === "ArrowUp") { ev.preventDefault(); app.st.cmdIdx = Math.max(0, app.st.cmdIdx - 1); paintCmdActive(); }
      if (ev.key === "Enter" && items[app.st.cmdIdx]) {
        ev.preventDefault();
        runCmd(items[app.st.cmdIdx].kind + ":" + items[app.st.cmdIdx].id);
      }
      return;
    }
    if (typing) return;

    if (app.view === "staff" && ev.key.toLowerCase() === "n") {
      ev.preventDefault();
      newApt = { branchId: app.st.branch === "all" ? C.branches[0].id : app.st.branch,
                 catId: null, treatmentId: null, date: null, slot: null, name: "", phone: "" };
      app.st.modal = "new"; render();
    }
    if (app.view === "patient" && ev.key === "Enter") {
      var btn = $('.btn.primary[data-act="next"], .btn.primary[data-act="submit"]');
      if (btn && !btn.disabled) btn.click();
    }
  });

  function paintCmdActive() {
    $$(".cmdres").forEach(function (b, i) {
      b.setAttribute("data-active", String(i === app.st.cmdIdx));
    });
  }

  /* ---------- boot -------------------------------------------------- */

  S.onChange(function () {
    /* A patient booking on another device should appear here live. */
    if (app.view === "reminder") { render(); return; }
    if (app.view === "staff" && !app.st.cmd && !app.st.modal) render();
  });

  goTo(viewFromHash() || "patient", true);
  render();

  S.init().then(function (kind) {
    app.backend = kind;
    render();
    if (kind === "db") toast("Live — bookings sync across devices", { icon: "refresh" });
  }).catch(function () { render(); });
})();
