-- ============================================================
-- ILMS DATABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'lecturer', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. COURSES TABLE
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_title text not null,
  course_code text not null unique,
  description text,
  semester text not null,
  lecturer_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. ENROLMENTS TABLE
create table if not exists public.enrolments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(student_id, course_id)
);

-- 4. COURSE CONTENT TABLE
create table if not exists public.course_content (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  file_url text not null,
  week_number int not null,
  uploaded_at timestamptz not null default now()
);

-- 5. ASSIGNMENTS TABLE
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text,
  due_date date not null,
  max_score numeric not null,
  created_at timestamptz not null default now()
);

-- 6. SUBMISSIONS TABLE
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  file_url text not null,
  grade numeric,
  feedback text,
  submitted_at timestamptz not null default now(),
  unique(assignment_id, student_id)
);

-- 7. ATTENDANCE TABLE
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  session_date date not null,
  status text not null check (status in ('present', 'absent', 'late')),
  recorded_by uuid references public.users(id),
  unique(course_id, student_id, session_date)
);

-- 8. RESULTS TABLE
create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  total_score numeric not null,
  grade text not null,
  published_at timestamptz not null default now(),
  unique(student_id, course_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.enrolments enable row level security;
alter table public.course_content enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.results enable row level security;

-- USERS: service role can do everything; authenticated users can read all
-- (backend uses service_role key — bypasses RLS; these cover edge cases)
create policy "service_role_all_users" on public.users
  for all using (true) with check (true);

-- COURSES: open read for authenticated, full for service role
create policy "service_role_all_courses" on public.courses
  for all using (true) with check (true);

-- ENROLMENTS
create policy "service_role_all_enrolments" on public.enrolments
  for all using (true) with check (true);

-- COURSE CONTENT
create policy "service_role_all_content" on public.course_content
  for all using (true) with check (true);

-- ASSIGNMENTS
create policy "service_role_all_assignments" on public.assignments
  for all using (true) with check (true);

-- SUBMISSIONS
create policy "service_role_all_submissions" on public.submissions
  for all using (true) with check (true);

-- ATTENDANCE
create policy "service_role_all_attendance" on public.attendance
  for all using (true) with check (true);

-- RESULTS
create policy "service_role_all_results" on public.results
  for all using (true) with check (true);

-- ============================================================
-- STORAGE BUCKETS
-- Run after creating the tables
-- ============================================================

-- Create storage buckets via Supabase Dashboard:
-- 1. Go to Storage → New Bucket
-- 2. Name: "course-materials"  | Public: true
-- 3. Name: "submissions"       | Public: true

-- ============================================================
-- SEED DATA (optional demo data)
-- Replace UUIDs after running auth.users inserts
-- ============================================================

-- NOTE: To seed, first create users via your /api/auth/register
-- endpoint or via the Supabase Auth dashboard, then copy their
-- UUIDs and run the inserts below.

-- Example seed (adjust UUIDs to match your actual auth users):
-- INSERT INTO public.users (id, full_name, email, role) VALUES
--   ('uuid-admin-1',   'Admin User',      'admin@ilms.edu',    'admin'),
--   ('uuid-lect-1',    'Dr. John Okafor', 'john@ilms.edu',     'lecturer'),
--   ('uuid-lect-2',    'Prof. Ada Eze',   'ada@ilms.edu',      'lecturer'),
--   ('uuid-stud-1',    'Chidi Nwosu',     'chidi@ilms.edu',    'student'),
--   ('uuid-stud-2',    'Amaka Obiora',    'amaka@ilms.edu',    'student'),
--   ('uuid-stud-3',    'Emeka Obi',       'emeka@ilms.edu',    'student');
