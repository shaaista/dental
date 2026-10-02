/* ============================================================
   store.js — clinic configuration + swappable data layer
   ------------------------------------------------------------
   The UI never talks to a database directly. It talks to Store.
   Swap the adapter at the bottom of this file to move from the
   demo backend to Supabase without touching app.js.
   ============================================================ */

(function (global) {
  "use strict";

  /* ---------- clinic configuration ----------------------------------
     Branches, opening hours and the full treatment menu come from
     smileandglow.com (Mon–Sat, 10:00–13:00 and 18:00–21:00, closed
     Sunday). Doctor names are placeholders — the clinic fills in its
     own from Settings. All of this is editable by the owner.
  ------------------------------------------------------------------ */

  var CLINIC = {
    name: "Smile and Glow",
    tagline: "Dental Health Care",
    currency: "₹",

    branches: [
      {
        id: "jn",
        name: "Jawahar Nagar",
        area: "Perambur, Chennai 600082",
        phone: "+91 94455 51044",
        chairs: 3
      },
      {
        id: "mg",
        name: "Mogappair",
        area: "Mogappair East, Chennai 600037",
        phone: "+91 81229 37208",
        chairs: 2
      }
    ],

    /* Mon=1 … Sat=6. Sunday (0) absent = closed. */
    hours: {
      1: [["10:00", "13:00"], ["18:00", "21:00"]],
      2: [["10:00", "13:00"], ["18:00", "21:00"]],
      3: [["10:00", "13:00"], ["18:00", "21:00"]],
      4: [["10:00", "13:00"], ["18:00", "21:00"]],
      5: [["10:00", "13:00"], ["18:00", "21:00"]],
      6: [["10:00", "13:00"], ["18:00", "21:00"]]
    },

    /* Placeholders. Real names go in from Settings on day one —
       only the specialities matter here, because they decide which
       doctor a treatment can be booked with. */
    doctors: [
      { id: "d1", name: "Dr. One",   short: "Dr. One",
        role: "Orthodontist · Implantologist · Neuromuscular", branches: ["jn", "mg"] },
      { id: "d2", name: "Dr. Two",   short: "Dr. Two",
        role: "Microscopic Endodontist · TMJ & Airway", branches: ["jn", "mg"] },
      { id: "d3", name: "Dr. Three", short: "Dr. Three",
        role: "Paediatric & Preventive Dentistry", branches: ["jn"] },
      { id: "d4", name: "Dr. Four",  short: "Dr. Four",
        role: "General & Cosmetic Dentistry", branches: ["mg"] }
    ],

    /* The nine departments the clinic leads with on its own home page,
       plus the two everyday reasons people actually walk in. */
    categories: [
      { id: "checkup", name: "Check-up & Cleaning",   ta: "பரிசோதனை",            icon: "mirror" },
      { id: "pain",    name: "Tooth Pain · Urgent",   ta: "பல் வலி",                    icon: "urgent" },
      { id: "endo",    name: "Root Canal",            ta: "ரூட் கால்வாய்", icon: "canal" },
      { id: "ortho",   name: "Braces & Invisalign",   ta: "பல் கம்பி",          icon: "braces" },
      { id: "implant", name: "Dental Implants",       ta: "பல் பொருத்துதல்", icon: "implant" },
      { id: "cosmo",   name: "Cosmetic & Smile Design", ta: "அழகு பல் சிகிச்சை", icon: "smile" },
      { id: "kids",    name: "Kids Dentistry",        ta: "குழந்தை பல்",       icon: "kid" },
      { id: "rehab",   name: "Full Mouth Rehabilitation", ta: "முழு வாய் சீரமைப்பு", icon: "arch" },
      { id: "tmj",     name: "TMJ & Facial Pain",     ta: "தாடை வலி",              icon: "jaw" },
      { id: "sleep",   name: "Snoring & Sleep Apnea", ta: "குறட்டை",               icon: "sleep" }
    ],

    /* Every entry is a real page on smileandglow.com.
       mins  = how long the chair is actually blocked
       recallDays = when the patient must be chased back. 0 = never. */
    treatments: [
      { id: "consult",   cat: "checkup", name: "Consultation",                 mins: 20, doctors: ["d1", "d2", "d3", "d4"], recallDays: 0,   value: 200 },
      { id: "scaling",   cat: "checkup", name: "Scaling & Polishing",          mins: 30, doctors: ["d3", "d4", "d2"],        recallDays: 180, value: 1800 },
      { id: "gum",       cat: "checkup", name: "Gum Treatment",                mins: 45, doctors: ["d2", "d4"],               recallDays: 90,  value: 6000 },
      { id: "filling",   cat: "checkup", name: "Tooth Coloured Filling",       mins: 40, doctors: ["d3", "d4", "d2"],        recallDays: 180, value: 2500 },

      { id: "urgent",    cat: "pain",    name: "Tooth Pain — same day",        mins: 20, doctors: ["d2", "d3", "d4", "d1"], recallDays: 7,   value: 500 },
      { id: "wisdom",    cat: "pain",    name: "Wisdom Tooth Removal",         mins: 45, doctors: ["d1", "d2"],               recallDays: 10,  value: 7000 },
      { id: "trauma",    cat: "pain",    name: "Dental Trauma",                mins: 45, doctors: ["d2", "d3"],               recallDays: 14,  value: 6000 },

      { id: "rct",       cat: "endo",    name: "Microscopic Root Canal",       mins: 60, doctors: ["d2"],                      recallDays: 14,  value: 9000 },
      { id: "rct_re",    cat: "endo",    name: "Retreatment of Failed RCT",    mins: 75, doctors: ["d2"],                      recallDays: 14,  value: 13000 },
      { id: "crown",     cat: "endo",    name: "Crown Fitting",                mins: 45, doctors: ["d2", "d4"],               recallDays: 180, value: 8500 },
      { id: "periapical", cat: "endo",   name: "Periapical Surgery",           mins: 75, doctors: ["d2"],                      recallDays: 21,  value: 15000 },

      { id: "metal",     cat: "ortho",   name: "Metal Braces",                 mins: 45, doctors: ["d1"],                      recallDays: 28,  value: 45000 },
      { id: "ceramic",   cat: "ortho",   name: "Ceramic Braces",               mins: 45, doctors: ["d1"],                      recallDays: 28,  value: 65000 },
      { id: "damon",     cat: "ortho",   name: "Damon Braces",                 mins: 45, doctors: ["d1"],                      recallDays: 28,  value: 85000 },
      { id: "invisalign", cat: "ortho",  name: "Invisalign",                   mins: 40, doctors: ["d1"],                      recallDays: 42,  value: 180000 },
      { id: "adjust",    cat: "ortho",   name: "Braces Adjustment",            mins: 20, doctors: ["d1"],                      recallDays: 28,  value: 1500 },

      { id: "implant1",  cat: "implant", name: "Dental Implant",               mins: 90, doctors: ["d1", "d2"],               recallDays: 90,  value: 45000 },
      { id: "sameday",   cat: "implant", name: "Same-Day Implant",             mins: 120, doctors: ["d1"],                     recallDays: 90,  value: 65000 },
      { id: "keyhole",   cat: "implant", name: "3D Guided Keyhole Implant",    mins: 105, doctors: ["d1"],                     recallDays: 90,  value: 85000 },
      { id: "implant_rv", cat: "implant", name: "Implant Review",              mins: 25, doctors: ["d1", "d2"],               recallDays: 180, value: 1000 },

      { id: "dsd",       cat: "cosmo",   name: "Digital Smile Design",         mins: 60, doctors: ["d4", "d2"],               recallDays: 30,  value: 25000 },
      { id: "veneers",   cat: "cosmo",   name: "Dental Veneers",               mins: 75, doctors: ["d4", "d2"],               recallDays: 180, value: 40000 },
      { id: "whiten",    cat: "cosmo",   name: "Teeth Whitening",              mins: 45, doctors: ["d4", "d3"],               recallDays: 180, value: 9000 },
      { id: "depig",     cat: "cosmo",   name: "Gum Depigmentation",           mins: 45, doctors: ["d4"],                      recallDays: 90,  value: 12000 },
      { id: "jewel",     cat: "cosmo",   name: "Tooth Jewellery",              mins: 20, doctors: ["d4"],                      recallDays: 0,   value: 1500 },

      { id: "kids_chk",  cat: "kids",    name: "Child Check-up",               mins: 30, doctors: ["d3"],                      recallDays: 180, value: 800 },
      { id: "kids_rct",  cat: "kids",    name: "Pulp Therapy / Milk Tooth RCT", mins: 45, doctors: ["d3"],                     recallDays: 30,  value: 4500 },
      { id: "kids_gas",  cat: "kids",    name: "Treatment with Laughing Gas",  mins: 60, doctors: ["d3"],                      recallDays: 90,  value: 9000 },
      { id: "kids_space", cat: "kids",   name: "Space Maintainer",             mins: 40, doctors: ["d3", "d1"],               recallDays: 90,  value: 6000 },
      { id: "tongue",    cat: "kids",    name: "Tongue Tie / Lip Tie",         mins: 40, doctors: ["d3", "d2"],               recallDays: 21,  value: 12000 },

      { id: "rehab_pln", cat: "rehab",   name: "Rehabilitation Planning",      mins: 60, doctors: ["d1", "d2"],               recallDays: 21,  value: 5000 },
      { id: "rehab_stg", cat: "rehab",   name: "Rehabilitation Sitting",       mins: 90, doctors: ["d1", "d2"],               recallDays: 30,  value: 60000 },
      { id: "fullceramic", cat: "rehab", name: "Full Mouth Fixed Ceramic",     mins: 120, doctors: ["d1", "d2"],              recallDays: 180, value: 250000 },
      { id: "denture",   cat: "rehab",   name: "Dentures & Bridges",           mins: 60, doctors: ["d4", "d1"],               recallDays: 180, value: 30000 },

      { id: "tmj_asmt",  cat: "tmj",     name: "TMJ Assessment",               mins: 45, doctors: ["d2", "d1"],               recallDays: 30,  value: 4000 },
      { id: "neuro",     cat: "tmj",     name: "Neuromuscular Therapy",        mins: 60, doctors: ["d2", "d1"],               recallDays: 30,  value: 35000 },
      { id: "myo",       cat: "tmj",     name: "Myofunctional Therapy",        mins: 45, doctors: ["d2"],                      recallDays: 30,  value: 18000 },

      { id: "osa_asmt",  cat: "sleep",   name: "Sleep Apnea Assessment",       mins: 45, doctors: ["d2", "d1"],               recallDays: 90,  value: 5000 },
      { id: "osa_appl",  cat: "sleep",   name: "Oral Appliance Fitting",       mins: 60, doctors: ["d2", "d1"],               recallDays: 90,  value: 55000 },
      { id: "kids_sleep", cat: "sleep",  name: "Child Sleep Disorder",         mins: 45, doctors: ["d3", "d2"],               recallDays: 60,  value: 15000 }
    ],

    /* Message templates — editable in Settings in the live product. */
    templates: {
      confirm:
        "Hello {name}, your appointment at Smile and Glow {branch} is confirmed.\n\n" +
        "📅 {date} at {time}\n🦷 {treatment} with {doctor}\n\n" +
        "Reply RESCHEDULE to change the time. See you soon!",
      remind24:
        "Hi {name}, a reminder about your visit tomorrow at Smile and Glow {branch}.\n\n" +
        "🕒 {time} · {treatment}\n\nTap to confirm or reschedule: {link}",
      recall:
        "Hello {name}, it has been {gap} since your {treatment} at Smile and Glow.\n\n" +
        "Dr. {doctor} recommends a follow-up visit. Shall we book you a slot this week?"
    }
  };

  /* ---------- helpers ------------------------------------------------ */

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function iso(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function addDays(base, n) {
    var d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    d.setDate(d.getDate() + n);
    return d;
  }

  function parseISO(s) {
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function minutesOf(hhmm) {
    var p = hhmm.split(":");
    return (+p[0]) * 60 + (+p[1]);
  }

  function hhmmOf(mins) {
    return pad(Math.floor(mins / 60)) + ":" + pad(mins % 60);
  }

  function pretty(hhmm) {
    var m = minutesOf(hhmm), h = Math.floor(m / 60), mm = m % 60;
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + pad(mm) + " " + ap;
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }

  function uid(prefix) {
    return (prefix || "id") + "_" +
      Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* A short human code the patient can quote on the phone. */
  function ticketCode() {
    var s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "SG-";
    for (var i = 0; i < 5; i++) out += s[Math.floor(Math.random() * s.length)];
    return out;
  }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var T = {
    treatment: function (id) { return byId(CLINIC.treatments, id); },
    doctor:    function (id) { return byId(CLINIC.doctors, id); },
    branch:    function (id) { return byId(CLINIC.branches, id); },
    category:  function (id) { return byId(CLINIC.categories, id); },
    /* Treatments in a category that this branch can actually deliver. */
    inCategory: function (catId, branchId) {
      return CLINIC.treatments.filter(function (tr) {
        if (tr.cat !== catId) return false;
        if (!branchId) return true;
        return doctorsFor(tr.id, branchId).length > 0;
      });
    }
  };

  /* ---------- slot engine --------------------------------------------
     Given a date, a branch and a treatment, work out every start time
     that is genuinely free: inside opening hours, long enough for the
     treatment, and not already taken by that doctor.
  ------------------------------------------------------------------ */

  var STEP = 15; // slot grid, in minutes

  function doctorsFor(treatmentId, branchId) {
    var tr = T.treatment(treatmentId);
    if (!tr) return [];
    return CLINIC.doctors.filter(function (d) {
      return tr.doctors.indexOf(d.id) !== -1 && d.branches.indexOf(branchId) !== -1;
    });
  }

  function windowsFor(dateISO) {
    return CLINIC.hours[parseISO(dateISO).getDay()] || null;
  }

  function isOpen(dateISO) { return !!windowsFor(dateISO); }

  /* Returns [{time, doctorId, doctorShort}] — one entry per free start. */
  function freeSlots(dateISO, branchId, treatmentId, appointments) {
    var wins = windowsFor(dateISO);
    if (!wins) return [];

    var tr = T.treatment(treatmentId);
    if (!tr) return [];

    var docs = doctorsFor(treatmentId, branchId);
    if (!docs.length) return [];

    /* Busy ranges per doctor for this date + branch. */
    var busy = {};
    docs.forEach(function (d) { busy[d.id] = []; });

    appointments.forEach(function (a) {
      if (a.date !== dateISO) return;
      if (a.branchId !== branchId) return;
      if (a.status === "cancelled" || a.status === "noshow") return;
      if (!busy[a.doctorId]) return;
      var s = minutesOf(a.time);
      busy[a.doctorId].push([s, s + (a.mins || 30)]);
    });

    var now = new Date();
    var todayISO = iso(now);
    var nowMins = now.getHours() * 60 + now.getMinutes();

    var out = [];
    wins.forEach(function (w) {
      var open = minutesOf(w[0]), shut = minutesOf(w[1]);
      for (var t = open; t + tr.mins <= shut; t += STEP) {
        /* never offer a time that has already passed today */
        if (dateISO === todayISO && t <= nowMins + 30) continue;

        var free = null;
        for (var i = 0; i < docs.length; i++) {
          var d = docs[i], clash = false;
          for (var j = 0; j < busy[d.id].length; j++) {
            var b = busy[d.id][j];
            if (t < b[1] && (t + tr.mins) > b[0]) { clash = true; break; }
          }
          if (!clash) { free = d; break; }
        }
        if (free) out.push({ time: hhmmOf(t), doctorId: free.id, doctorShort: free.short });
      }
    });
    return out;
  }

  /* ---------- recall engine ------------------------------------------
     The feature that makes the clinic money: which finished patients
     are overdue for their next visit, ranked by how much is at stake.
  ------------------------------------------------------------------ */

  function buildRecalls(appointments, today) {
    var seen = {};      // phone+treatment -> latest completed visit
    var future = {};    // phone -> has an upcoming booking

    appointments.forEach(function (a) {
      if (a.status === "booked" || a.status === "arrived") {
        if (parseISO(a.date) >= today) future[a.phone] = true;
      }
    });

    appointments.forEach(function (a) {
      if (a.status !== "done") return;
      var tr = T.treatment(a.treatmentId);
      if (!tr || !tr.recallDays) return;
      var key = a.phone + "|" + a.treatmentId;
      if (!seen[key] || seen[key].date < a.date) seen[key] = a;
    });

    var rows = [];
    Object.keys(seen).forEach(function (k) {
      var a = seen[k];
      var tr = T.treatment(a.treatmentId);
      var due = addDays(parseISO(a.date), tr.recallDays);
      var overdueBy = daysBetween(due, today);
      if (overdueBy < -7) return;               // not due for a while yet
      if (future[a.phone]) return;              // already coming back
      if (a.recallHandled) return;              // staff already dealt with it

      rows.push({
        id: a.id,
        name: a.name,
        phone: a.phone,
        branchId: a.branchId,
        treatmentId: a.treatmentId,
        treatment: tr.name,
        doctorId: a.doctorId,
        lastVisit: a.date,
        dueOn: iso(due),
        overdueBy: overdueBy,
        value: tr.value
      });
    });

    rows.sort(function (x, y) {
      if (y.overdueBy !== x.overdueBy) return y.overdueBy - x.overdueBy;
      return y.value - x.value;
    });
    return rows;
  }

  /* ---------- patients, derived from appointment history ------------- */

  function buildPatients(appointments) {
    var map = {};
    appointments.forEach(function (a) {
      var p = map[a.phone];
      if (!p) {
        p = map[a.phone] = {
          phone: a.phone, name: a.name, email: a.email || "",
          branchId: a.branchId, visits: 0, spend: 0,
          first: a.date, last: null, next: null, treatments: {}
        };
      }
      p.name = p.name || a.name;
      if (a.date < p.first) p.first = a.date;
      if (a.status === "done") {
        p.visits += 1;
        var tr = T.treatment(a.treatmentId);
        if (tr) { p.spend += tr.value; p.treatments[tr.name] = true; }
        if (!p.last || a.date > p.last) p.last = a.date;
      }
      if (a.status === "booked" || a.status === "arrived") {
        if (!p.next || a.date < p.next) p.next = a.date;
      }
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return (b.last || "").localeCompare(a.last || ""); });
  }

  /* ---------- demo dataset -------------------------------------------
     Fictional patients on a realistic schedule, generated relative to
     today so the dashboard is never empty and never stale.
     Replaced entirely by real data once the clinic goes live.
  ------------------------------------------------------------------ */

  var FIRST = ["Karthik", "Meena", "Arjun", "Divya", "Ramesh", "Lakshmi", "Suresh", "Priya",
               "Vignesh", "Kavitha", "Anand", "Nithya", "Bala", "Revathi", "Ganesh", "Shalini",
               "Hari", "Deepa", "Manoj", "Sowmya", "Prakash", "Janani", "Vimal", "Gayathri"];
  var LAST  = ["Raman", "Subramanian", "Iyer", "Natarajan", "Venkatesh", "Krishnan",
               "Murugan", "Balaji", "Sundaram", "Rajan", "Pillai", "Shankar"];

  function seededRandom(seed) {
    var s = seed;
    return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  }

  function makeDemo() {
    var rnd = seededRandom(20260917);
    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var rows = [];
    var people = [];

    for (var i = 0; i < 46; i++) {
      var nm = FIRST[Math.floor(rnd() * FIRST.length)] + " " +
               LAST[Math.floor(rnd() * LAST.length)];
      people.push({
        name: nm,
        phone: "9" + String(Math.floor(rnd() * 900000000) + 100000000).slice(0, 9),
        email: nm.split(" ")[0].toLowerCase() + Math.floor(rnd() * 90 + 10) + "@gmail.com"
      });
    }

    function push(dayOffset, time, treatmentId, branchId, person, status, source) {
      var tr = T.treatment(treatmentId);
      var docs = doctorsFor(treatmentId, branchId);
      if (!docs.length) return;
      var doc = docs[Math.floor(rnd() * docs.length)];
      var d = addDays(today, dayOffset);
      if (!isOpen(iso(d))) return;
      rows.push({
        id: uid("apt"),
        code: ticketCode(),
        date: iso(d),
        time: time,
        mins: tr.mins,
        branchId: branchId,
        treatmentId: treatmentId,
        doctorId: doc.id,
        name: person.name,
        phone: person.phone,
        email: person.email,
        isNew: rnd() > 0.72,
        notes: "",
        source: source || (rnd() > 0.45 ? "online" : "phone"),
        status: status,
        createdAt: new Date(d.getTime() - 86400000 * 2).toISOString(),
        recallHandled: false
      });
    }

    var morning = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];
    var evening = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];
    /* Weighted so the day book looks like a real clinic: lots of
       check-ups and adjustments, a few big cases. */
    var allTreat = [];
    CLINIC.treatments.forEach(function (t) {
      var weight = t.value >= 60000 ? 1 : (t.value >= 20000 ? 2 : (t.value >= 5000 ? 4 : 7));
      for (var w = 0; w < weight; w++) allTreat.push(t.id);
    });

    /* --- history: the last 200 days, mostly completed --------------- */
    for (var back = 200; back >= 1; back--) {
      var dISO = iso(addDays(today, -back));
      if (!isOpen(dISO)) continue;
      var count = 2 + Math.floor(rnd() * 4);
      for (var c = 0; c < count; c++) {
        var slot = (rnd() > 0.5 ? morning : evening)[Math.floor(rnd() * 6)];
        var tid = allTreat[Math.floor(rnd() * allTreat.length)];
        var bid = rnd() > 0.45 ? "jn" : "mg";
        var per = people[Math.floor(rnd() * people.length)];
        var roll = rnd();
        var st = roll > 0.14 ? "done" : (roll > 0.06 ? "noshow" : "cancelled");
        push(-back, slot, tid, bid, per, st);
      }
    }

    /* --- today: a live-looking mix --------------------------------
       Anchored to the clock when the clinic is actually open, and to
       mid-morning otherwise, so the dashboard never opens empty just
       because someone is looking at it late at night. */
    var clock = new Date().getHours() * 60 + new Date().getMinutes();
    var nowM = (clock >= 630 && clock <= 750) || (clock >= 1110 && clock <= 1200)
      ? clock : 11 * 60;
    var todayPlan = [
      ["10:00", "scaling",   "jn"], ["10:30", "rct",        "jn"],
      ["11:00", "adjust",    "jn"], ["11:30", "consult",    "jn"],
      ["12:00", "crown",     "jn"], ["12:30", "urgent",     "jn"],
      ["10:00", "kids_chk",  "mg"], ["10:30", "whiten",     "mg"],
      ["11:00", "implant1",  "mg"], ["12:00", "consult",    "mg"],
      ["18:00", "consult",   "jn"], ["18:30", "scaling",    "jn"],
      ["19:00", "rct",       "jn"], ["19:30", "adjust",     "jn"],
      ["20:00", "tmj_asmt",  "jn"], ["20:30", "urgent",     "jn"],
      ["18:00", "dsd",       "mg"], ["19:00", "osa_asmt",   "mg"],
      ["19:30", "implant_rv", "mg"], ["20:30", "filling",   "mg"]
    ];
    todayPlan.forEach(function (row, k) {
      var per = people[k % people.length];
      var st = minutesOf(row[0]) + 45 < nowM ? "done"
             : (minutesOf(row[0]) <= nowM + 15 ? "arrived" : "booked");
      push(0, row[0], row[1], row[2], per, st);
    });

    /* --- the next three weeks ------------------------------------- */
    for (var fwd = 1; fwd <= 21; fwd++) {
      var fISO = iso(addDays(today, fwd));
      if (!isOpen(fISO)) continue;
      var n = Math.max(1, 5 - Math.floor(fwd / 5)) + Math.floor(rnd() * 3);
      for (var q = 0; q < n; q++) {
        var s2 = (rnd() > 0.5 ? morning : evening)[Math.floor(rnd() * 6)];
        var t2 = allTreat[Math.floor(rnd() * allTreat.length)];
        var b2 = rnd() > 0.45 ? "jn" : "mg";
        var p2 = people[Math.floor(rnd() * people.length)];
        push(fwd, s2, t2, b2, p2, "booked");
      }
    }

    /* de-duplicate: one doctor cannot be in two places at once */
    var taken = {};
    return rows.filter(function (a) {
      var key = a.date + "|" + a.doctorId + "|" + a.time;
      if (taken[key]) return false;
      taken[key] = true;
      return true;
    });
  }

  /* ---------- adapters -------------------------------------------------
     Every adapter exposes the same four methods. app.js knows nothing
     about which one is running.

        load()            -> Promise<appointment[]>
        create(apt)       -> Promise<appointment>
        update(id, patch) -> Promise<void>
        watch(cb)         -> unsubscribe | null
  --------------------------------------------------------------------- */

  /* 1. Memory adapter — the preview / offline fallback. */
  function MemoryAdapter() {
    var rows = makeDemo();
    return {
      kind: "memory",
      load: function () { return Promise.resolve(rows.slice()); },
      create: function (apt) { rows.push(apt); return Promise.resolve(apt); },
      update: function (id, patch) {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].id === id) { Object.assign(rows[i], patch); break; }
        }
        return Promise.resolve();
      },
      watch: function () { return null; }
    };
  }

  /* 2. Artifact db adapter — shared, live, multi-viewer.
        Patient books on their phone; the dashboard updates itself. */
  function DbAdapter(db) {
    var col = db.collection("appointments");
    return {
      kind: "db",
      load: function () {
        return col.get().then(function (snap) {
          return snap.docs.map(function (d) {
            var v = d.data() || {};
            v.id = v.id || d.id;
            return v;
          });
        });
      },
      create: function (apt) {
        return col.doc(apt.id).set(apt).then(function () { return apt; });
      },
      update: function (id, patch) {
        return col.doc(id).update(patch);
      },
      watch: function (cb) {
        try {
          return col.onSnapshot(function (snap) {
            cb(snap.docs.map(function (d) {
              var v = d.data() || {};
              v.id = v.id || d.id;
              return v;
            }));
          }, function () { /* transient — keep the last good render */ });
        } catch (e) { return null; }
      }
    };
  }

  /* 3. Supabase adapter — for the live deployment.
        Uncomment, drop in the project URL + anon key, and the whole
        app runs on Postgres with realtime. Nothing else changes.
        (Blocked inside the Artifact sandbox, which cannot reach
        external hosts — this is the production path.)

     function SupabaseAdapter(url, anonKey) {
       var sb = supabase.createClient(url, anonKey);
       var TBL = "appointments";
       return {
         kind: "supabase",
         load: function () {
           return sb.from(TBL).select("*").then(function (r) { return r.data || []; });
         },
         create: function (apt) {
           return sb.from(TBL).insert(apt).then(function () { return apt; });
         },
         update: function (id, patch) {
           return sb.from(TBL).update(patch).eq("id", id);
         },
         watch: function (cb) {
           var ch = sb.channel("apts")
             .on("postgres_changes", { event: "*", schema: "public", table: TBL },
                 function () { this.load().then(cb); }.bind(this))
             .subscribe();
           return function () { sb.removeChannel(ch); };
         }
       };
     }
  */

  /* ---------- Store facade --------------------------------------- */

  var Store = {
    clinic: CLINIC,
    T: T,
    adapter: null,
    appointments: [],
    listeners: [],

    util: {
      pad: pad, iso: iso, addDays: addDays, parseISO: parseISO,
      minutesOf: minutesOf, hhmmOf: hhmmOf, pretty: pretty,
      daysBetween: daysBetween, uid: uid, ticketCode: ticketCode
    },

    isOpen: isOpen,
    windowsFor: windowsFor,
    doctorsFor: doctorsFor,
    freeSlots: function (dateISO, branchId, treatmentId) {
      return freeSlots(dateISO, branchId, treatmentId, this.appointments);
    },
    recalls: function (today) { return buildRecalls(this.appointments, today || startOfToday()); },
    patients: function () { return buildPatients(this.appointments); },

    onChange: function (fn) { this.listeners.push(fn); },
    emit: function () {
      var self = this;
      this.listeners.forEach(function (f) { try { f(self.appointments); } catch (e) {} });
    },

    /* Pick the best backend available, then load. */
    init: function () {
      var self = this;

      function finish(adapter) {
        self.adapter = adapter;
        return adapter.load().then(function (rows) {
          if (adapter.kind === "db" && rows.length === 0) {
            /* An empty shared database would show the clinic a dead
               dashboard. Fall back to the demo set for this view. */
            self.adapter = MemoryAdapter();
            return self.adapter.load();
          }
          return rows;
        }).then(function (rows) {
          self.appointments = rows;
          self.emit();
          var stop = self.adapter.watch && self.adapter.watch(function (fresh) {
            self.appointments = fresh;
            self.emit();
          });
          self._stop = stop;
          return self.adapter.kind;
        });
      }

      if (!global.claude || typeof global.claude.use !== "function") {
        return finish(MemoryAdapter());
      }

      var settled = false;
      return new Promise(function (resolve) {
        /* Never block first paint on a capability handshake. */
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          resolve(finish(MemoryAdapter()));
        }, 2500);

        global.claude.use("db").then(function (db) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(finish(db ? DbAdapter(db) : MemoryAdapter()));
        }).catch(function () {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(finish(MemoryAdapter()));
        });
      });
    },

    book: function (input) {
      var tr = T.treatment(input.treatmentId);
      var apt = {
        id: uid("apt"),
        code: ticketCode(),
        date: input.date,
        time: input.time,
        mins: tr ? tr.mins : 30,
        branchId: input.branchId,
        treatmentId: input.treatmentId,
        doctorId: input.doctorId,
        name: input.name,
        phone: input.phone,
        email: input.email || "",
        isNew: !!input.isNew,
        notes: input.notes || "",
        source: input.source || "online",
        status: "booked",
        createdAt: new Date().toISOString(),
        recallHandled: false
      };
      this.appointments = this.appointments.concat([apt]);
      this.emit();
      var self = this;
      return this.adapter.create(apt).then(function () { return apt; })
        .catch(function () { return apt; })
        .then(function (a) { self.emit(); return a; });
    },

    patch: function (id, patch) {
      this.appointments = this.appointments.map(function (a) {
        return a.id === id ? Object.assign({}, a, patch) : a;
      });
      this.emit();
      return this.adapter.update(id, patch).catch(function () {});
    },

    find: function (id) {
      for (var i = 0; i < this.appointments.length; i++) {
        if (this.appointments[i].id === id) return this.appointments[i];
      }
      return null;
    }
  };

  function startOfToday() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  Store.today = startOfToday;

  global.Store = Store;
})(window);
