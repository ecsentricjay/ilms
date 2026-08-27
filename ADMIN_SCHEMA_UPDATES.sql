-- ============================================================
-- ADMIN ENHANCEMENT SQL SNIPPETS
-- Run these in Supabase SQL Editor to enable admin data modification
-- ============================================================

-- 1. ADD AUDIT TRAIL COLUMNS (optional - tracks who modified what)
-- These columns help track admin modifications
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS modified_at timestamptz;

ALTER TABLE public.results ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES public.users(id);
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS modified_at timestamptz;

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES public.users(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS modified_at timestamptz;

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES public.users(id);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS modified_at timestamptz;

-- ============================================================
-- 2. VIEW: DETAILED LECTURER INFORMATION
-- Provides comprehensive lecturer stats for admin dashboard
-- ============================================================
CREATE OR REPLACE VIEW lecturer_details AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.is_active,
  u.created_at,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT e.student_id) as total_students,
  COUNT(DISTINCT a.id) as total_assignments,
  SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) as total_attendance_marked,
  COUNT(DISTINCT sub.id) as total_submissions_graded
FROM public.users u
LEFT JOIN public.courses c ON u.id = c.lecturer_id
LEFT JOIN public.enrolments e ON c.id = e.course_id
LEFT JOIN public.assignments a ON c.id = a.course_id
LEFT JOIN public.attendance att ON c.id = att.course_id AND att.recorded_by = u.id
LEFT JOIN public.submissions sub ON a.id = sub.assignment_id AND sub.grade IS NOT NULL
WHERE u.role = 'lecturer'
GROUP BY u.id, u.full_name, u.email, u.is_active, u.created_at;

-- ============================================================
-- 3. VIEW: DETAILED STUDENT INFORMATION
-- Provides comprehensive student stats for admin dashboard
-- ============================================================
CREATE OR REPLACE VIEW student_details AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.is_active,
  u.created_at,
  COUNT(DISTINCT e.course_id) as enrolled_courses,
  COUNT(DISTINCT sub.assignment_id) as total_submissions,
  COUNT(DISTINCT CASE WHEN sub.grade IS NOT NULL THEN sub.id END) as graded_submissions,
  ROUND(AVG(CASE WHEN sub.grade IS NOT NULL THEN sub.grade ELSE NULL END)::numeric, 2) as average_assignment_score,
  COUNT(DISTINCT att.id) as attendance_records,
  COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END) as present_count,
  COUNT(DISTINCT CASE WHEN att.status = 'absent' THEN att.id END) as absent_count,
  COUNT(DISTINCT CASE WHEN att.status = 'late' THEN att.id END) as late_count,
  COUNT(DISTINCT r.id) as published_results
FROM public.users u
LEFT JOIN public.enrolments e ON u.id = e.student_id
LEFT JOIN public.submissions sub ON u.id = sub.student_id
LEFT JOIN public.attendance att ON u.id = att.student_id
LEFT JOIN public.results r ON u.id = r.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email, u.is_active, u.created_at;

-- ============================================================
-- 4. VIEW: COURSE PERFORMANCE SUMMARY
-- Shows all students in a course with their performance
-- ============================================================
CREATE OR REPLACE VIEW course_student_performance AS
SELECT 
  c.id as course_id,
  c.course_title,
  c.course_code,
  u.id as student_id,
  u.full_name as student_name,
  u.email as student_email,
  COUNT(DISTINCT sub.id) as submissions,
  COUNT(DISTINCT CASE WHEN sub.grade IS NOT NULL THEN sub.id END) as graded_submissions,
  ROUND(AVG(CASE WHEN sub.grade IS NOT NULL THEN sub.grade ELSE NULL END)::numeric, 2) as avg_grade,
  COUNT(DISTINCT att.id) as attendance_records,
  COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END) as present_sessions,
  r.total_score,
  r.grade as final_grade
FROM public.courses c
LEFT JOIN public.enrolments e ON c.id = e.course_id
LEFT JOIN public.users u ON e.student_id = u.id
LEFT JOIN public.submissions sub ON u.id = sub.student_id AND c.id = (
  SELECT course_id FROM public.assignments WHERE id = sub.assignment_id
)
LEFT JOIN public.attendance att ON u.id = att.student_id AND c.id = att.course_id
LEFT JOIN public.results r ON u.id = r.student_id AND c.id = r.course_id
WHERE u.role = 'student'
GROUP BY c.id, c.course_title, c.course_code, u.id, u.full_name, u.email, r.total_score, r.grade;

-- ============================================================
-- 5. HELPER FUNCTION: Update user profile
-- Usage: SELECT update_user_profile('user-uuid', 'New Name', 'Admin UUID')
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id uuid,
  p_full_name text,
  p_admin_id uuid
)
RETURNS public.users AS $$
BEGIN
  UPDATE public.users 
  SET full_name = p_full_name,
      modified_by = p_admin_id,
      modified_at = now()
  WHERE id = p_user_id;
  
  RETURN (SELECT * FROM public.users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. HELPER FUNCTION: Update student grade in a course
-- Usage: SELECT update_result('student-uuid', 'course-uuid', 85.5, 'A', 'Admin UUID')
-- ============================================================
CREATE OR REPLACE FUNCTION update_result(
  p_student_id uuid,
  p_course_id uuid,
  p_total_score numeric,
  p_grade text,
  p_admin_id uuid
)
RETURNS public.results AS $$
BEGIN
  INSERT INTO public.results (student_id, course_id, total_score, grade, published_at, modified_by, modified_at)
  VALUES (p_student_id, p_course_id, p_total_score, p_grade, now(), p_admin_id, now())
  ON CONFLICT (student_id, course_id)
  DO UPDATE SET 
    total_score = p_total_score,
    grade = p_grade,
    modified_by = p_admin_id,
    modified_at = now();
  
  RETURN (SELECT * FROM public.results WHERE student_id = p_student_id AND course_id = p_course_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. HELPER FUNCTION: Update or create attendance record
-- Usage: SELECT update_attendance('student-uuid', 'course-uuid', '2024-08-27', 'present', 'Admin UUID')
-- ============================================================
CREATE OR REPLACE FUNCTION update_attendance(
  p_student_id uuid,
  p_course_id uuid,
  p_session_date date,
  p_status text,
  p_admin_id uuid
)
RETURNS public.attendance AS $$
BEGIN
  INSERT INTO public.attendance (student_id, course_id, session_date, status, recorded_by, modified_by, modified_at)
  VALUES (p_student_id, p_course_id, p_session_date, p_status, p_admin_id, p_admin_id, now())
  ON CONFLICT (student_id, course_id, session_date)
  DO UPDATE SET 
    status = p_status,
    modified_by = p_admin_id,
    modified_at = now();
  
  RETURN (SELECT * FROM public.attendance WHERE student_id = p_student_id AND course_id = p_course_id AND session_date = p_session_date);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. HELPER FUNCTION: Update submission grade
-- Usage: SELECT update_submission_grade('submission-uuid', 85.5, 'Great work!', 'Admin UUID')
-- ============================================================
CREATE OR REPLACE FUNCTION update_submission_grade(
  p_submission_id uuid,
  p_grade numeric,
  p_feedback text,
  p_admin_id uuid
)
RETURNS public.submissions AS $$
BEGIN
  UPDATE public.submissions 
  SET grade = p_grade,
      feedback = p_feedback,
      modified_by = p_admin_id,
      modified_at = now()
  WHERE id = p_submission_id;
  
  RETURN (SELECT * FROM public.submissions WHERE id = p_submission_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. EXAMPLE QUERIES FOR ADMIN OPERATIONS
-- ============================================================

-- Get lecturer details with all their course information
-- SELECT * FROM lecturer_details WHERE id = 'lecturer-uuid-here';

-- Get student details with performance summary
-- SELECT * FROM student_details WHERE id = 'student-uuid-here';

-- Get all students in a specific course with their performance
-- SELECT * FROM course_student_performance WHERE course_id = 'course-uuid-here';

-- Update a student's total score in a course
-- SELECT update_result('student-uuid', 'course-uuid', 92.5, 'A', 'admin-uuid');

-- Update attendance record
-- SELECT update_attendance('student-uuid', 'course-uuid', '2024-08-27', 'present', 'admin-uuid');

-- Update a submission grade
-- SELECT update_submission_grade('submission-uuid', 88, 'Excellent submission!', 'admin-uuid');

-- Update a user's profile
-- SELECT update_user_profile('user-uuid', 'New Full Name', 'admin-uuid');
