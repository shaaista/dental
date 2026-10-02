-- ============================================================
-- Smile & Glow Front Desk — Supabase / Postgres schema
-- Run this once in the Supabase SQL editor, then point
-- store.js at SupabaseAdapter(url, anonKey).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- clinics (one row per customer, for white-labelling) ----------
create table if not exists clinics (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,           -- 'smile-and-glow'
  name        text not null,
  tagline     text,
  brand_hex   text default '#0079DB',
  accent_hex  text default '#01B9A1',
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- ---------- branches ----------
create table if not exists branches (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  code        text not null,                  -- 'jn', 'mg'
  name        text not null,
  area        text,
  phone       text,
  chairs      int  not null default 1,
  unique (clinic_id, code)
);

-- ---------- opening hours (one row per window, per weekday) ----------
-- weekday: 0 = Sunday … 6 = Saturday. A weekday with no rows is closed.
create table if not exists opening_hours (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references branches(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  opens_at    time not null,
  closes_at   time not null,
  check (closes_at > opens_at)
);

-- ---------- doctors ----------
create table if not exists doctors (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  code        text not null,
  name        text not null,
  short_name  text not null,
  role        text,
  active      boolean not null default true,
  unique (clinic_id, code)
);

create table if not exists doctor_branches (
  doctor_id   uuid not null references doctors(id) on delete cascade,
  branch_id   uuid not null references branches(id) on delete cascade,
  primary key (doctor_id, branch_id)
);

-- Days off, conference leave, lunch blocks.
create table if not exists doctor_blocks (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references doctors(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  check (ends_at > starts_at)
);

-- ---------- treatments ----------
create table if not exists treatments (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics(id) on delete cascade,
  code          text not null,
  name          text not null,
  name_local    text,                         -- Tamil label
  duration_min  int  not null default 30,
  recall_days   int  not null default 0,      -- 0 = never chase
  value_inr     int  not null default 0,      -- what a completed visit is worth
  icon          text,
  active        boolean not null default true,
  unique (clinic_id, code)
);

create table if not exists treatment_doctors (
  treatment_id uuid not null references treatments(id) on delete cascade,
  doctor_id    uuid not null references doctors(id) on delete cascade,
  primary key (treatment_id, doctor_id)
);

-- ---------- patients ----------
create table if not exists patients (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  phone       text not null,
  name        text not null,
  email       text,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (clinic_id, phone)
);

-- ---------- appointments ----------
create type appointment_status as enum
  ('booked', 'arrived', 'done', 'noshow', 'cancelled');

create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics(id) on delete cascade,
  branch_id       uuid not null references branches(id),
  doctor_id       uuid not null references doctors(id),
  treatment_id    uuid not null references treatments(id),
  patient_id      uuid references patients(id),

  code            text not null,              -- 'SG-K4M2P', quoted on the phone
  starts_at       timestamptz not null,
  duration_min    int not null,
  status          appointment_status not null default 'booked',

  name            text not null,              -- denormalised: survives patient merges
  phone           text not null,
  email           text,
  is_new_patient  boolean not null default true,
  notes           text,
  source          text not null default 'online',  -- online | phone | walkin | whatsapp

  recall_handled  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_apt_day     on appointments (clinic_id, starts_at);
create index if not exists idx_apt_branch  on appointments (branch_id, starts_at);
create index if not exists idx_apt_phone   on appointments (clinic_id, phone);
create index if not exists idx_apt_status  on appointments (clinic_id, status);

-- One doctor cannot be in two chairs at once. This is the guarantee that
-- makes double-booking impossible even under a race between two patients
-- tapping the same slot at the same moment.
create extension if not exists btree_gist;
alter table appointments
  add constraint no_double_booking
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, starts_at + (duration_min || ' minutes')::interval) with &&
  )
  where (status in ('booked', 'arrived', 'done'));

-- ---------- message log (what was sent, when, to whom) ----------
create table if not exists messages (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references clinics(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  phone          text not null,
  kind           text not null,   -- confirm | remind24 | remind2 | noshow | recall | review
  channel        text not null default 'whatsapp',
  body           text,
  status         text not null default 'queued',  -- queued | sent | delivered | read | failed
  sent_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_msg_apt on messages (appointment_id);

-- ---------- message templates ----------
create table if not exists templates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics(id) on delete cascade,
  kind       text not null,
  body       text not null,
  enabled    boolean not null default true,
  unique (clinic_id, kind)
);

-- ---------- staff ----------
create table if not exists staff (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics(id) on delete cascade,
  user_id    uuid not null,                  -- auth.users.id
  role       text not null default 'reception',  -- owner | doctor | reception
  branch_id  uuid references branches(id),
  unique (clinic_id, user_id)
);

-- ---------- the recall list, as a view -------------------------------
-- The dashboard reads this directly. A patient appears when their last
-- completed treatment is past its recall window and they have nothing
-- booked ahead of them.
create or replace view recall_due as
with last_done as (
  select distinct on (a.clinic_id, a.phone, a.treatment_id)
         a.id, a.clinic_id, a.phone, a.name, a.branch_id,
         a.doctor_id, a.treatment_id, a.starts_at, a.recall_handled
  from appointments a
  where a.status = 'done'
  order by a.clinic_id, a.phone, a.treatment_id, a.starts_at desc
),
has_future as (
  select distinct clinic_id, phone
  from appointments
  where status in ('booked', 'arrived') and starts_at >= now()
)
select
  ld.id,
  ld.clinic_id,
  ld.name,
  ld.phone,
  ld.branch_id,
  ld.doctor_id,
  t.name                                as treatment,
  ld.starts_at::date                    as last_visit,
  (ld.starts_at + (t.recall_days || ' days')::interval)::date as due_on,
  (current_date - (ld.starts_at + (t.recall_days || ' days')::interval)::date) as overdue_by,
  t.value_inr                           as value
from last_done ld
join treatments t on t.id = ld.treatment_id
left join has_future hf
       on hf.clinic_id = ld.clinic_id and hf.phone = ld.phone
where t.recall_days > 0
  and ld.recall_handled = false
  and hf.phone is null
  and current_date >= (ld.starts_at + ((t.recall_days - 7) || ' days')::interval)::date
order by overdue_by desc, value desc;

-- ---------- row level security ----------
alter table appointments enable row level security;
alter table patients     enable row level security;
alter table messages     enable row level security;

-- Staff see only their own clinic.
create policy staff_reads_own_clinic on appointments
  for select using (
    clinic_id in (select clinic_id from staff where user_id = auth.uid())
  );

create policy staff_writes_own_clinic on appointments
  for all using (
    clinic_id in (select clinic_id from staff where user_id = auth.uid())
  );

-- The public booking widget inserts through an edge function using the
-- service role, never the anon key — so patients can create a booking
-- but can never read anyone else's.

-- ---------- keep updated_at honest ----------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apt_touch on appointments;
create trigger trg_apt_touch before update on appointments
  for each row execute function touch_updated_at();
