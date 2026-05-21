const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/assignments/course/:courseId — Get assignments for a course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', req.params.courseId)
      .order('due_date', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assignments — Lecturer creates assignment
router.post('/', authenticate, requireRole('lecturer'), async (req, res) => {
  const { course_id, title, instructions, due_date, max_score } = req.body;
  if (!course_id || !title || !due_date || !max_score) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert({ course_id, title, instructions, due_date, max_score })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assignments/:id/submissions — Lecturer views submissions
router.get('/:id/submissions', authenticate, requireRole('lecturer'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, users!submissions_student_id_fkey(full_name, email)')
      .eq('assignment_id', req.params.id)
      .order('submitted_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assignments/:id/my-submission — Student gets their own submission
router.get('/:id/my-submission', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', req.params.id)
      .eq('student_id', req.user.id)
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assignments/:id/submit — Student submits assignment
router.post('/:id/submit', authenticate, requireRole('student'), async (req, res) => {
  const { file_url } = req.body;
  if (!file_url) return res.status(400).json({ error: 'File URL required' });

  try {
    // Check for existing submission
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', req.params.id)
      .eq('student_id', req.user.id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted this assignment' });
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert({ assignment_id: req.params.id, student_id: req.user.id, file_url })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/assignments/submissions/:submissionId/grade — Lecturer grades
router.patch('/submissions/:submissionId/grade', authenticate, requireRole('lecturer'), async (req, res) => {
  const { grade, feedback } = req.body;
  if (grade === undefined) return res.status(400).json({ error: 'Grade is required' });

  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({ grade, feedback })
      .eq('id', req.params.submissionId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
