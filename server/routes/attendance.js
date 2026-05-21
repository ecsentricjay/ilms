const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/attendance/course/:courseId/student — Student views own attendance
router.get('/course/:courseId/student', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('course_id', req.params.courseId)
      .eq('student_id', req.user.id)
      .order('session_date', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/attendance/course/:courseId — Lecturer views all attendance for course
router.get('/course/:courseId', authenticate, requireRole('lecturer'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, users!attendance_student_id_fkey(full_name, email)')
      .eq('course_id', req.params.courseId)
      .order('session_date', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendance/record — Lecturer records attendance for a session
router.post('/record', authenticate, requireRole('lecturer'), async (req, res) => {
  const { course_id, session_date, records } = req.body;
  // records: [{ student_id, status }]

  if (!course_id || !session_date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'course_id, session_date and records array required' });
  }

  try {
    const rows = records.map(r => ({
      course_id,
      student_id: r.student_id,
      session_date,
      status: r.status,
      recorded_by: req.user.id
    }));

    // Upsert to allow re-recording same session
    const { data, error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'course_id,student_id,session_date' })
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
