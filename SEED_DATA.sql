-- ============================================================
-- ILMS SEED DATA - Test Data Population
-- ============================================================
-- This file populates your database with test data
-- Run this in Supabase SQL Editor AFTER creating actual users via /api/auth/register
-- OR use the admin create-lecturer endpoint for lecturers
--
-- STEPS:
-- 1. First, register users via the application (auth.users will be created automatically)
-- 2. Copy their UUIDs from Supabase Auth users table
-- 3. Replace the UUID placeholders below with actual UUIDs
-- 4. Run this entire script
-- ============================================================

-- IMPORTANT: Generate UUIDs first. You can use these commands to create valid test UUIDs:
-- In Postgres: SELECT gen_random_uuid();
-- Or use: https://www.uuidgenerator.net/

-- ============================================================
-- SAMPLE TEST DATA (Replace these UUIDs with actual ones)
-- ============================================================
-- For testing purposes, here are UUID format examples:
-- Admin:     550e8400-e29b-41d4-a716-446655440001
-- Lecturer1: 550e8400-e29b-41d4-a716-446655440002
-- Lecturer2: 550e8400-e29b-41d4-a716-446655440003
-- Lecturer3: 550e8400-e29b-41d4-a716-446655440004
-- Student1:  550e8400-e29b-41d4-a716-446655440005
-- Student2:  550e8400-e29b-41d4-a716-446655440006
-- Student3:  550e8400-e29b-41d4-a716-446655440007
-- Student4:  550e8400-e29b-41d4-a716-446655440008
-- Student5:  550e8400-e29b-41d4-a716-446655440009

-- ============================================================
-- 1. USERS TABLE - Insert actual users
-- ============================================================
-- DELETE FROM public.users; -- Uncomment to clear existing data first

INSERT INTO public.users (id, full_name, email, role, is_active, created_at) VALUES
  -- Admin
  ('550e8400-e29b-41d4-a716-446655440001', 'Admin User', 'admin@ilms.edu', 'admin', true, now()),

  -- Lecturers
  ('550e8400-e29b-41d4-a716-446655440002', 'Dr. John Okafor', 'john.okafor@ilms.edu', 'lecturer', true, now() - interval '60 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Prof. Ada Eze', 'ada.eze@ilms.edu', 'lecturer', true, now() - interval '45 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Dr. Emeka Nnamdi', 'emeka.nnamdi@ilms.edu', 'lecturer', true, now() - interval '30 days'),

  -- Students
  ('550e8400-e29b-41d4-a716-446655440005', 'Chidi Nwosu', 'chidi.nwosu@student.edu', 'student', true, now() - interval '90 days'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Amaka Obiora', 'amaka.obiora@student.edu', 'student', true, now() - interval '85 days'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Ikechukwu Obi', 'ikechukwu.obi@student.edu', 'student', true, now() - interval '80 days'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Blessing Okoro', 'blessing.okoro@student.edu', 'student', true, now() - interval '75 days'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Zainab Ibrahim', 'zainab.ibrahim@student.edu', 'student', true, now() - interval '70 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. COURSES TABLE - Create test courses
-- ============================================================
-- DELETE FROM public.courses; -- Uncomment to clear existing data first

INSERT INTO public.courses (id, course_title, course_code, description, semester, lecturer_id, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Introduction to Programming', 'CS 101', 'Fundamentals of programming using Python', '2024/2025 First Semester', '550e8400-e29b-41d4-a716-446655440002', now() - interval '60 days'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Database Systems', 'CS 301', 'Design and implementation of databases', '2024/2025 First Semester', '550e8400-e29b-41d4-a716-446655440003', now() - interval '60 days'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Web Development', 'CS 201', 'Frontend and backend web technologies', '2024/2025 First Semester', '550e8400-e29b-41d4-a716-446655440002', now() - interval '55 days'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Data Structures', 'CS 102', 'Arrays, lists, trees, and graphs', '2024/2025 First Semester', '550e8400-e29b-41d4-a716-446655440004', now() - interval '50 days'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Discrete Mathematics', 'MATH 201', 'Sets, logic, and combinatorics', '2024/2025 First Semester', '550e8400-e29b-41d4-a716-446655440004', now() - interval '50 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. ENROLMENTS TABLE - Enrol students in courses
-- ============================================================
-- DELETE FROM public.enrolments; -- Uncomment to clear existing data first

INSERT INTO public.enrolments (id, student_id, course_id, enrolled_at) VALUES
  -- Chidi enrolled in multiple courses
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', now() - interval '45 days'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', now() - interval '45 days'),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', now() - interval '40 days'),
  ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004', now() - interval '40 days'),

  -- Amaka enrolled in multiple courses
  ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440001', now() - interval '45 days'),
  ('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', now() - interval '44 days'),
  ('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440005', now() - interval '40 days'),

  -- Ikechukwu enrolled in multiple courses
  ('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440001', now() - interval '42 days'),
  ('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003', now() - interval '42 days'),
  ('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440004', now() - interval '38 days'),

  -- Blessing enrolled in courses
  ('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440002', now() - interval '40 days'),
  ('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440003', now() - interval '38 days'),

  -- Zainab enrolled in courses
  ('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440001', now() - interval '35 days'),
  ('750e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440002', now() - interval '34 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. ATTENDANCE TABLE - Mark attendance for students
-- ============================================================
-- DELETE FROM public.attendance; -- Uncomment to clear existing data first

INSERT INTO public.attendance (id, student_id, course_id, session_date, status, recorded_by) VALUES
  -- Chidi's attendance in CS 101
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '2024-08-20', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '2024-08-21', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '2024-08-22', 'late', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '2024-08-23', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', '2024-08-24', 'present', '550e8400-e29b-41d4-a716-446655440002'),

  -- Chidi's attendance in CS 301
  ('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', '2024-08-20', 'present', '550e8400-e29b-41d4-a716-446655440003'),
  ('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', '2024-08-21', 'absent', '550e8400-e29b-41d4-a716-446655440003'),
  ('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', '2024-08-22', 'present', '550e8400-e29b-41d4-a716-446655440003'),

  -- Amaka's attendance in CS 101
  ('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440001', '2024-08-20', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440001', '2024-08-21', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440001', '2024-08-22', 'present', '550e8400-e29b-41d4-a716-446655440002'),

  -- Ikechukwu's attendance
  ('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440001', '2024-08-20', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440001', '2024-08-21', 'present', '550e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440001', '2024-08-23', 'present', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. ASSIGNMENTS TABLE - Create assignments for courses
-- ============================================================
-- DELETE FROM public.assignments; -- Uncomment to clear existing data first

INSERT INTO public.assignments (id, course_id, title, instructions, due_date, max_score, created_at) VALUES
  -- CS 101 assignments
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Assignment 1: Python Basics', 'Write Python programs for basic operations', '2024-08-30', 20, now() - interval '15 days'),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Assignment 2: Functions', 'Create reusable functions and modules', '2024-09-06', 20, now() - interval '10 days'),

  -- CS 301 assignments
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'Assignment 1: Database Design', 'Design ER diagram for a system', '2024-09-03', 25, now() - interval '12 days'),
  ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Assignment 2: SQL Queries', 'Write complex SQL queries', '2024-09-10', 25, now() - interval '8 days'),

  -- CS 201 assignments
  ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'Assignment 1: HTML/CSS', 'Create responsive website layout', '2024-08-29', 20, now() - interval '14 days'),
  ('950e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003', 'Assignment 2: JavaScript', 'Implement interactive features', '2024-09-05', 20, now() - interval '9 days'),

  -- CS 102 assignments
  ('950e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440004', 'Assignment 1: Arrays and Lists', 'Implement basic data structures', '2024-09-01', 20, now() - interval '12 days'),

  -- MATH 201 assignments
  ('950e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440005', 'Assignment 1: Set Theory', 'Solve set theory problems', '2024-08-31', 20, now() - interval '11 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SUBMISSIONS TABLE - Student submissions
-- ============================================================
-- DELETE FROM public.submissions; -- Uncomment to clear existing data first

INSERT INTO public.submissions (id, assignment_id, student_id, file_url, grade, feedback, submitted_at) VALUES
  -- Chidi's submissions for CS 101
  ('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'uploads/chidi_assignment1_cs101.py', 18, 'Good work! Well structured code.', now() - interval '10 days'),
  ('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'uploads/chidi_assignment2_cs101.py', 19, 'Excellent! Clear and efficient functions.', now() - interval '5 days'),

  -- Chidi's submissions for CS 301
  ('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'uploads/chidi_assignment1_cs301.pdf', 23, 'Very good ER diagram. Minor improvements needed.', now() - interval '8 days'),
  ('a50e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'uploads/chidi_assignment2_cs301.sql', 22, 'Good queries. Optimize the JOIN operations.', now() - interval '3 days'),

  -- Amaka's submissions for CS 101
  ('a50e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'uploads/amaka_assignment1_cs101.py', 17, 'Good effort. Add more comments to your code.', now() - interval '9 days'),
  ('a50e8400-e29b-41d4-a716-446655440006', '950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'uploads/amaka_assignment2_cs101.py', 16, 'Logic is correct but could be more efficient.', now() - interval '4 days'),

  -- Ikechukwu's submissions for CS 101
  ('a50e8400-e29b-41d4-a716-446655440007', '950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'uploads/ikechukwu_assignment1_cs101.py', 20, 'Excellent submission! Very clean code.', now() - interval '11 days'),
  ('a50e8400-e29b-41d4-a716-446655440008', '950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'uploads/ikechukwu_assignment2_cs101.py', NULL, NULL, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. RESULTS TABLE - Final grades for courses
-- ============================================================
-- DELETE FROM public.results; -- Uncomment to clear existing data first

INSERT INTO public.results (id, student_id, course_id, total_score, grade, published_at) VALUES
  -- Chidi's results
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440001', 92.5, 'A', now() - interval '2 days'),
  ('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 87.0, 'A', now() - interval '2 days'),
  ('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004', 85.5, 'A', now() - interval '1 day'),

  -- Amaka's results
  ('b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440001', 78.5, 'B', now() - interval '2 days'),
  ('b50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', 82.0, 'B', now() - interval '2 days'),

  -- Ikechukwu's results
  ('b50e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440001', 95.0, 'A', now() - interval '2 days'),
  ('b50e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003', 88.5, 'A', now() - interval '2 days'),

  -- Blessing's results
  ('b50e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440002', 72.0, 'C', now() - interval '3 days'),

  -- Zainab's results
  ('b50e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440001', 89.5, 'A', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. COURSE CONTENT TABLE - Add materials/resources
-- ============================================================
-- DELETE FROM public.course_content; -- Uncomment to clear existing data first

INSERT INTO public.course_content (id, course_id, title, file_url, week_number, uploaded_at) VALUES
  -- CS 101 materials
  ('c50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Week 1: Introduction to Python', 'materials/cs101_week1.pdf', 1, now() - interval '55 days'),
  ('c50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Week 2: Variables and Data Types', 'materials/cs101_week2.pdf', 2, now() - interval '50 days'),
  ('c50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'Week 3: Control Flow', 'materials/cs101_week3.pdf', 3, now() - interval '45 days'),

  -- CS 301 materials
  ('c50e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Week 1: Database Fundamentals', 'materials/cs301_week1.pdf', 1, now() - interval '55 days'),
  ('c50e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 'Week 2: ER Modeling', 'materials/cs301_week2.pdf', 2, now() - interval '50 days'),
  ('c50e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', 'Week 3: SQL Basics', 'materials/cs301_week3.pdf', 3, now() - interval '45 days'),

  -- CS 201 materials
  ('c50e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003', 'Week 1: HTML Essentials', 'materials/cs201_week1.pdf', 1, now() - interval '50 days'),
  ('c50e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440003', 'Week 2: CSS Styling', 'materials/cs201_week2.pdf', 2, now() - interval '45 days'),

  -- CS 102 materials
  ('c50e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440004', 'Week 1: Arrays and Lists', 'materials/cs102_week1.pdf', 1, now() - interval '48 days'),

  -- MATH 201 materials
  ('c50e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440005', 'Week 1: Set Theory', 'materials/math201_week1.pdf', 1, now() - interval '48 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to verify your data was inserted correctly
-- ============================================================

-- Check how many records in each table
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Courses', COUNT(*) FROM public.courses
UNION ALL
SELECT 'Enrolments', COUNT(*) FROM public.enrolments
UNION ALL
SELECT 'Attendance', COUNT(*) FROM public.attendance
UNION ALL
SELECT 'Assignments', COUNT(*) FROM public.assignments
UNION ALL
SELECT 'Submissions', COUNT(*) FROM public.submissions
UNION ALL
SELECT 'Results', COUNT(*) FROM public.results
UNION ALL
SELECT 'Course Content', COUNT(*) FROM public.course_content;

-- View all lecturers with their course count
SELECT 
  u.full_name,
  u.email,
  COUNT(c.id) as course_count
FROM public.users u
LEFT JOIN public.courses c ON u.id = c.lecturer_id
WHERE u.role = 'lecturer'
GROUP BY u.id, u.full_name, u.email
ORDER BY u.full_name;

-- View all students with their enrolment count
SELECT 
  u.full_name,
  u.email,
  COUNT(e.id) as enrolled_courses,
  COUNT(DISTINCT sub.id) as total_submissions
FROM public.users u
LEFT JOIN public.enrolments e ON u.id = e.student_id
LEFT JOIN public.submissions sub ON u.id = sub.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email
ORDER BY u.full_name;

-- View all courses with enrolment counts
SELECT 
  c.course_code,
  c.course_title,
  u.full_name as lecturer,
  COUNT(DISTINCT e.id) as student_count,
  COUNT(DISTINCT a.id) as assignment_count,
  COUNT(DISTINCT cc.id) as material_count
FROM public.courses c
LEFT JOIN public.users u ON c.lecturer_id = u.id
LEFT JOIN public.enrolments e ON c.id = e.course_id
LEFT JOIN public.assignments a ON c.id = a.course_id
LEFT JOIN public.course_content cc ON c.id = cc.course_id
GROUP BY c.id, c.course_code, c.course_title, u.full_name
ORDER BY c.course_code;

-- ============================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================

-- UUID Mapping used in this file:
-- 550e8400-e29b-41d4-a716-446655440001 = Admin User
-- 550e8400-e29b-41d4-a716-446655440002 = Dr. John Okafor (Lecturer)
-- 550e8400-e29b-41d4-a716-446655440003 = Prof. Ada Eze (Lecturer)
-- 550e8400-e29b-41d4-a716-446655440004 = Dr. Emeka Nnamdi (Lecturer)
-- 550e8400-e29b-41d4-a716-446655440005 = Chidi Nwosu (Student)
-- 550e8400-e29b-41d4-a716-446655440006 = Amaka Obiora (Student)
-- 550e8400-e29b-41d4-a716-446655440007 = Ikechukwu Obi (Student)
-- 550e8400-e29b-41d4-a716-446655440008 = Blessing Okoro (Student)
-- 550e8400-e29b-41d4-a716-446655440009 = Zainab Ibrahim (Student)

-- IMPORTANT STEPS TO USE THIS FILE:
-- 1. First register users via the application's /api/auth/register endpoint
--    OR use the admin create-lecturer endpoint for lecturers
-- 2. Copy the actual UUIDs from Supabase Auth → Users
-- 3. Replace all UUID values in this file with actual UUIDs
-- 4. Run this entire script in Supabase SQL Editor
-- 5. Run the VERIFICATION QUERIES at the bottom to confirm

-- ALTERNATIVE: Quick test mode
-- If you just want to test with the UUIDs above, make sure:
-- 1. You have created auth users with those exact email addresses first
-- 2. Then run this script

-- CUSTOMIZATION:
-- - Change course codes, titles, and descriptions as needed
-- - Modify dates (now() - interval '...' adjusts past dates)
-- - Add more students/courses by copying rows
-- - Adjust grades and scores as needed
