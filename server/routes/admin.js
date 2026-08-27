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

// ============================================================
// NEW ADMIN FEATURES
// ============================================================

// POST /api/admin/create-lecturer — Admin creates a lecturer account
router.post('/create-lecturer', authenticate, requireRole('admin'), async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email, and password are required' });
  }

  try {
    // Step 1: Create auth user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Step 2: Insert into users table with lecturer role
    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({ id: authData.user.id, full_name, email, role: 'lecturer', is_active: true })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      // Rollback the auth user if DB insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: dbError.message });
    }

    res.status(201).json({
      message: 'Lecturer account created successfully',
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Create lecturer exception:', err);
    res.status(500).json({ error: 'Server error during lecturer creation' });
  }
});

// PATCH /api/admin/users/:id/profile — Admin updates user profile
router.patch('/users/:id/profile', authenticate, requireRole('admin'), async (req, res) => {
  const { full_name, email } = req.body;
  const adminId = req.user.id;

  if (!full_name && !email) {
    return res.status(400).json({ error: 'At least one field (full_name or email) is required' });
  }

  try {
    const updateData = { modified_by: adminId, modified_at: new Date() };
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'User profile updated', user: data });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/results/:id — Admin updates a student's result/grade in a course
router.patch('/results/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { total_score, grade } = req.body;
  const adminId = req.user.id;

  if (typeof total_score !== 'number' || !grade) {
    return res.status(400).json({ error: 'total_score (number) and grade (string) are required' });
  }

  try {
    const { data, error } = await supabase
      .from('results')
      .update({ total_score, grade, modified_by: adminId, modified_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Result updated', result: data });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/results — Admin creates or updates result for student in course
router.post('/results', authenticate, requireRole('admin'), async (req, res) => {
  const { student_id, course_id, total_score, grade } = req.body;
  const adminId = req.user.id;

  if (!student_id || !course_id || typeof total_score !== 'number' || !grade) {
    return res.status(400).json({ error: 'student_id, course_id, total_score, and grade are required' });
  }

  try {
    const { data, error } = await supabase
      .from('results')
      .upsert(
        { student_id, course_id, total_score, grade, published_at: new Date(), modified_by: adminId, modified_at: new Date() },
        { onConflict: 'student_id,course_id' }
      )
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Result created/updated', result: data });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/attendance/:id — Admin updates an attendance record
router.patch('/attendance/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  const adminId = req.user.id;

  if (!['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: present, absent, late' });
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({ status, modified_by: adminId, modified_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Attendance updated', attendance: data });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/attendance — Admin creates or updates attendance record
router.post('/attendance', authenticate, requireRole('admin'), async (req, res) => {
  const { student_id, course_id, session_date, status } = req.body;
  const adminId = req.user.id;

  if (!student_id || !course_id || !session_date || !['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ error: 'student_id, course_id, session_date, and status (present/absent/late) are required' });
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        { student_id, course_id, session_date, status, recorded_by: adminId, modified_by: adminId, modified_at: new Date() },
        { onConflict: 'student_id,course_id,session_date' }
      )
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Attendance created/updated', attendance: data });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/submissions/:id — Admin updates a submission grade and feedback
router.patch('/submissions/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { grade, feedback } = req.body;
  const adminId = req.user.id;

  if (typeof grade !== 'number') {
    return res.status(400).json({ error: 'grade (number) is required' });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({ grade, feedback: feedback || null, modified_by: adminId, modified_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Submission grade updated', submission: data });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/course/:id/students — Get all students in a course with performance data
router.get('/course/:id/students', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, users!courses_lecturer_id_fkey(id, full_name, email)')
      .eq('id', courseId)
      .single();

    if (courseError) return res.status(400).json({ error: courseError.message });

    // Get all enrolled students with their performance
    const { data: enrolments, error: enrolError } = await supabase
      .from('enrolments')
      .select('*, users!enrolments_student_id_fkey(id, full_name, email)')
      .eq('course_id', courseId);

    if (enrolError) return res.status(400).json({ error: enrolError.message });

    // Enrich each student with their performance data
    const enriched = await Promise.all(
      (enrolments || []).map(async (enrol) => {
        const [
          { data: submissions },
          { data: attendance },
          { data: results }
        ] = await Promise.all([
          supabase
            .from('submissions')
            .select('*, assignments(title, max_score)')
            .eq('student_id', enrol.student_id)
            .in('assignment_id', (
              await supabase
                .from('assignments')
                .select('id')
                .eq('course_id', courseId)
            ).data?.map(a => a.id) || []),
          supabase
            .from('attendance')
            .select('*')
            .eq('student_id', enrol.student_id)
            .eq('course_id', courseId),
          supabase
            .from('results')
            .select('*')
            .eq('student_id', enrol.student_id)
            .eq('course_id', courseId)
            .single()
        ]);

        const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
        const avgGrade = gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length
          : null;

        const attendanceSummary = {
          present: attendance?.filter(a => a.status === 'present').length || 0,
          absent: attendance?.filter(a => a.status === 'absent').length || 0,
          late: attendance?.filter(a => a.status === 'late').length || 0,
        };

        return {
          studentId: enrol.student_id,
          studentName: enrol.users.full_name,
          studentEmail: enrol.users.email,
          submissionCount: submissions?.length || 0,
          gradedSubmissions: gradedSubmissions.length,
          averageSubmissionGrade: avgGrade,
          attendance: attendanceSummary,
          result: results || null
        };
      })
    );

    res.json({ course, students: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/lecturer/:id/detailed — Enhanced lecturer details with all data
router.get('/lecturer/:id/detailed', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const lecturerId = req.params.id;

    // Get lecturer info
    const { data: lecturer, error: lecturerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', lecturerId)
      .single();

    if (lecturerError) return res.status(400).json({ error: lecturerError.message });

    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('lecturer_id', lecturerId);

    if (coursesError) return res.status(400).json({ error: coursesError.message });

    // For each course, get stats
    const enrichedCourses = await Promise.all(
      (courses || []).map(async (course) => {
        const [
          { count: studentCount },
          { count: materialCount },
          { count: assignmentCount },
          { data: submissions },
          { data: attendance }
        ] = await Promise.all([
          supabase.from('enrolments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('course_content').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('submissions').select('*').in('assignment_id', (
            await supabase.from('assignments').select('id').eq('course_id', course.id)
          ).data?.map(a => a.id) || []),
          supabase.from('attendance').select('*').eq('course_id', course.id)
        ]);

        const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
        const avgGrade = gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length
          : null;

        return {
          ...course,
          studentCount,
          materialCount,
          assignmentCount,
          totalSubmissions: submissions?.length || 0,
          gradedSubmissions: gradedSubmissions.length,
          averageSubmissionGrade: avgGrade,
          attendanceRecorded: attendance?.length || 0
        };
      })
    );

    res.json({
      lecturer,
      courses: enrichedCourses,
      summary: {
        totalCourses: enrichedCourses.length,
        totalStudents: enrichedCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0),
        totalAssignments: enrichedCourses.reduce((sum, c) => sum + (c.assignmentCount || 0), 0),
        totalSubmissions: enrichedCourses.reduce((sum, c) => sum + (c.totalSubmissions || 0), 0),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/student/:id/detailed — Enhanced student details with all data
router.get('/student/:id/detailed', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const studentId = req.params.id;

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) return res.status(400).json({ error: studentError.message });

    // Get all enrolments
    const { data: enrolments, error: enrolError } = await supabase
      .from('enrolments')
      .select('*, courses(id, course_title, course_code, semester, users!courses_lecturer_id_fkey(id, full_name, email))')
      .eq('student_id', studentId);

    if (enrolError) return res.status(400).json({ error: enrolError.message });

    // For each course, get detailed performance
    const coursePerformance = await Promise.all(
      (enrolments || []).map(async (enrol) => {
        const course = enrol.courses;

        // Get submissions
        const { data: submissions } = await supabase
          .from('submissions')
          .select('*, assignments(id, title, max_score, course_id)')
          .eq('student_id', studentId)
          .in('assignment_id', (
            await supabase.from('assignments').select('id').eq('course_id', course.id)
          ).data?.map(a => a.id) || []);

        // Get attendance
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentId)
          .eq('course_id', course.id);

        // Get result
        const { data: result } = await supabase
          .from('results')
          .select('*')
          .eq('student_id', studentId)
          .eq('course_id', course.id)
          .single();

        const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
        const avgSubmissionGrade = gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length
          : null;

        const attendanceSummary = {
          total: attendance?.length || 0,
          present: attendance?.filter(a => a.status === 'present').length || 0,
          absent: attendance?.filter(a => a.status === 'absent').length || 0,
          late: attendance?.filter(a => a.status === 'late').length || 0,
          attendanceRate: attendance && attendance.length > 0
            ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(2)
            : 0
        };

        return {
          courseId: course.id,
          courseTitle: course.course_title,
          courseCode: course.course_code,
          semester: course.semester,
          lecturer: course.users,
          submissions: submissions || [],
          submissionSummary: {
            total: submissions?.length || 0,
            graded: gradedSubmissions.length,
            pending: (submissions?.filter(s => s.grade === null).length || 0),
            averageGrade: avgSubmissionGrade
          },
          attendance: attendanceSummary,
          result: result || null
        };
      })
    );

    // Calculate overall statistics
    const allSubmissions = await supabase
      .from('submissions')
      .select('grade')
      .eq('student_id', studentId);

    const gradedSubmissions = allSubmissions.data?.filter(s => s.grade !== null) || [];
    const overallAverage = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length
      : null;

    res.json({
      student,
      coursePerformance,
      summary: {
        enrolledCourses: enrolments?.length || 0,
        totalSubmissions: allSubmissions.data?.length || 0,
        overallAverageGrade: overallAverage,
        coursesWithResults: coursePerformance.filter(c => c.result).length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
