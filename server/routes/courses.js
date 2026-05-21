const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/courses — Lecturer gets their courses; Admin gets all
router.get('/', authenticate, async (req, res) => {
  try {
    let query = supabase
      .from('courses')
      .select('*, users!courses_lecturer_id_fkey(full_name, email)');

    if (req.user.role === 'lecturer') {
      query = query.eq('lecturer_id', req.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/courses/enrolled — Student gets their enrolled courses
router.get('/enrolled', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrolments')
      .select('*, courses(*, users!courses_lecturer_id_fkey(full_name))')
      .eq('student_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data.map(e => e.courses));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/courses — Lecturer creates a course
router.post('/', authenticate, requireRole('lecturer'), async (req, res) => {
  const { course_title, course_code, description, semester } = req.body;
  if (!course_title || !course_code || !semester) {
    return res.status(400).json({ error: 'Title, code, and semester are required' });
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({ course_title, course_code, description, semester, lecturer_id: req.user.id })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/courses/:id/content — Get materials for a course
router.get('/:id/content', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', req.params.id)
      .order('week_number', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/courses/:id/content — Lecturer uploads material
router.post('/:id/content', authenticate, requireRole('lecturer'), async (req, res) => {
  const { title, file_url, week_number } = req.body;
  if (!title || !file_url || !week_number) {
    return res.status(400).json({ error: 'Title, file URL, and week number are required' });
  }

  try {
    const { data, error } = await supabase
      .from('course_content')
      .insert({ course_id: req.params.id, title, file_url, week_number })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/courses/:id/students — Lecturer sees enrolled students
router.get('/:id/students', authenticate, requireRole('lecturer', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrolments')
      .select('*, users!enrolments_student_id_fkey(id, full_name, email)')
      .eq('course_id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// POST /api/courses/:id/self-enrol — Student self-enrols
router.post('/:id/self-enrol', authenticate, requireRole('student'), async (req, res) => {
  try {
    // Check not already enrolled
    const { data: existing } = await supabase.from('enrolments').select('id').eq('student_id', req.user.id).eq('course_id', req.params.id).maybeSingle();
    if (existing) return res.status(400).json({ error: 'You are already enrolled in this course' });

    const { data, error } = await supabase.from('enrolments').insert({ student_id: req.user.id, course_id: req.params.id }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/courses/all — All courses for student browse
router.get('/browse/all', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data: enrolled } = await supabase.from('enrolments').select('course_id').eq('student_id', req.user.id);
    const enrolledIds = enrolled.map(e => e.course_id);

    const { data: all, error } = await supabase.from('courses').select('*, users!courses_lecturer_id_fkey(full_name)').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    const withStatus = all.map(c => ({ ...c, enrolled: enrolledIds.includes(c.id) }));
    res.json(withStatus);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});
