const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/admin/users — List all users
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active must be boolean' });
  try {
    const { data, error } = await supabase.from('users').update({ is_active }).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/courses — All courses with stats
router.get('/courses', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, users!courses_lecturer_id_fkey(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    // Attach enrolment counts
    const enriched = await Promise.all(data.map(async (course) => {
      const { count: studentCount } = await supabase.from('enrolments').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
      const { count: materialCount } = await supabase.from('course_content').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
      const { count: assignmentCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
      return { ...course, studentCount, materialCount, assignmentCount };
    }));

    res.json(enriched);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/lecturers — All lecturers
router.get('/lecturers', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, full_name, email').eq('role', 'lecturer').eq('is_active', true).order('full_name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/students — All students
router.get('/students', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, full_name, email').eq('role', 'student').eq('is_active', true).order('full_name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/lecturer/:id/stats — Detailed lecturer stats
router.get('/lecturer/:id/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data: lecturer } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    const { data: courses } = await supabase.from('courses').select('*, enrolments(count), course_content(count), assignments(count)').eq('lecturer_id', req.params.id);
    res.json({ lecturer, courses: courses || [] });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/student/:id/stats — Detailed student stats
router.get('/student/:id/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data: student } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    const { data: enrolments } = await supabase.from('enrolments').select('*, courses(course_title, course_code, semester, users!courses_lecturer_id_fkey(full_name))').eq('student_id', req.params.id);
    const { data: submissions } = await supabase.from('submissions').select('*, assignments(title, max_score, course_id)').eq('student_id', req.params.id);
    const { data: attendance } = await supabase.from('attendance').select('*').eq('student_id', req.params.id);
    const { data: results } = await supabase.from('results').select('*, courses(course_title, course_code)').eq('student_id', req.params.id);
    res.json({ student, enrolments: enrolments || [], submissions: submissions || [], attendance: attendance || [], results: results || [] });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/enrol — Enrol student into course
router.post('/enrol', authenticate, requireRole('admin'), async (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) return res.status(400).json({ error: 'student_id and course_id required' });
  try {
    const { data, error } = await supabase.from('enrolments').upsert({ student_id, course_id }, { onConflict: 'student_id,course_id' }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/enrolments
router.get('/enrolments', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('enrolments').select('*, users!enrolments_student_id_fkey(full_name, email), courses(course_title, course_code)').order('enrolled_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/courses — Admin creates a course and assigns to a lecturer
router.post('/courses', authenticate, requireRole('admin'), async (req, res) => {
  const { course_title, course_code, description, semester, lecturer_id } = req.body;
  if (!course_title || !course_code || !semester || !lecturer_id) return res.status(400).json({ error: 'All fields required' });
  try {
    const { data, error } = await supabase.from('courses').insert({ course_title, course_code, description, semester, lecturer_id }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/courses/:id/reassign — Reassign course to different lecturer
router.patch('/courses/:id/reassign', authenticate, requireRole('admin'), async (req, res) => {
  const { lecturer_id } = req.body;
  if (!lecturer_id) return res.status(400).json({ error: 'lecturer_id required' });
  try {
    const { data, error } = await supabase.from('courses').update({ lecturer_id }).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/stats — Dashboard summary
router.get('/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [{ count: totalUsers }, { count: totalStudents }, { count: totalLecturers },
           { count: totalCourses }, { count: totalEnrolments }, { count: totalSubmissions }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('enrolments').select('*', { count: 'exact', head: true }),
      supabase.from('submissions').select('*', { count: 'exact', head: true }),
    ]);
    res.json({ totalUsers, totalStudents, totalLecturers, totalCourses, totalEnrolments, totalSubmissions });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
