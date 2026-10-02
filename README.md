# Front Desk — dental clinic booking & recall

A working demo of a booking, reminder and patient-recall system for a
multi-branch dental clinic. Built for **Smile and Glow Dental Health Care**
(Jawahar Nagar and Mogappair, Chennai).

No build step, no framework, no dependencies. Three static files.

---

## The three surfaces

| Page | Link | Who uses it |
|---|---|---|
| Booking | `/#book` | Patients, embedded on the clinic website |
| Reminder | `/#reminder` | Patients, opened from the WhatsApp reminder |
| Dashboard | `/#dashboard` | Clinic staff |

All three run on the same data. Reschedule on the reminder page and the
dashboard updates immediately.

---

## What it does

**Booking** — branch → department → treatment → a real free slot. The slot
list is generated from opening hours, treatment duration and which doctors
are qualified and on site, so a root canal is only ever offered against the
endodontist's free time. English and Tamil.

**Reminder link** — confirm, reschedule or cancel without phoning the clinic.
Medical history is collected before arrival. After the visit it asks for a
rating: four or five stars are pointed at Google, one to three go privately
to the owner.

**Dashboard** — today's list with one-tap *Arrived / Finish / No-show* (every
action is undoable), a per-doctor calendar, patient records with full visit
history, reports, and settings.

**Recall list** — the reason the thing exists. It works out who finished a
treatment, never came back, and has nothing booked, then ranks them by what
the unfinished course is worth. The front desk gets a short list of names to
call each morning instead of a spreadsheet nobody opens.

---

## Running it

Any static server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

---

## Files

```
index.html           standalone page (GitHub Pages / Vercel / any host)
artifact.html        same page as a fragment, for Claude Artifacts
styles.css           design system and all three layouts
store.js             clinic config, slot engine, recall engine, data layer
app.js               rendering and interaction
supabase-schema.sql  production Postgres schema
vercel.json          hosting config
```

---

## Demo data

The demo runs on generated sample data — about 600 appointments across the
last 200 days and the next three weeks, rebuilt on every page load.

**Patient names and records are invented. Doctors are placeholders**
(Dr. One … Dr. Four) so that only the specialities, which drive slot
routing, are real. Branches, opening hours and the full treatment menu are
the clinic's own.

Nothing is written to a server in this demo. Refreshing resets everything.

---

## Going to production

The UI never touches a database directly — it goes through `Store`, which
takes an adapter. `store.js` ships three:

- `MemoryAdapter` — the demo (default)
- `DbAdapter` — Claude Artifacts shared storage
- `SupabaseAdapter` — commented out, ready for the live deployment

Switching to Supabase is one line, because every adapter exposes the same
four methods: `load`, `create`, `update`, `watch`.

`supabase-schema.sql` has the full schema. Worth noting: it includes an
exclusion constraint that makes double-booking impossible at the database
level, even if two patients tap the same slot in the same millisecond.

```sql
exclude using gist (
  doctor_id with =,
  tstzrange(starts_at, starts_at + (duration_min || ' minutes')::interval) with &&
) where (status in ('booked', 'arrived', 'done'))
```

### Still to build

- WhatsApp Cloud API wiring for the automatic messages
- Staff authentication and roles
- Super-admin for white-labelling to other clinics

---

## Configuring it for another clinic

Everything clinic-specific is the `CLINIC` object at the top of `store.js`:
branches, opening hours, doctors, departments, treatments, durations, recall
windows and message templates. No other file needs touching.
