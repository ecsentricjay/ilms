const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/results/student — Student views own results
router.get('/student', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*, courses(course_title, course_code)')
      .eq('student_id', req.user.id)
      .order('published_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/results/course/:courseId — Lecturer views results for course
router.get('/course/:courseId', authenticate, requireRole('lecturer'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*, users!results_student_id_fkey(full_name, email)')
      .eq('course_id', req.params.courseId)
      .order('published_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/results — Lecturer publishes a result
router.post('/', authenticate, requireRole('lecturer'), async (req, res) => {
  const { student_id, course_id, total_score, grade } = req.body;
  if (!student_id || !course_id || total_score === undefined || !grade) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const { data, error } = await supabase
      .from('results')
      .upsert({ student_id, course_id, total_score, grade }, { onConflict: 'student_id,course_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
