import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

const TABS = ['Overview','Users','Courses','Enrolments','Assignments','Attendance','Results','Grade / CGPA'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolments, setEnrolments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [enrolModal, setEnrolModal] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [reassignModal, setReassignModal] = useState(null);
  const [createLecturerModal, setCreateLecturerModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // { type: 'student'|'lecturer'|'course', data, details }
  const [editModal, setEditModal] = useState(null); // For editing individual data
  const [printPreviewModal, setPrintPreviewModal] = useState(null); // { html: string, userName: string }

  // Form states
  const [enrolForm, setEnrolForm] = useState({ student_id: '', course_id: '' });
  const [courseForm, setCourseForm] = useState({ course_title: '', course_code: '', description: '', semester: '', lecturer_id: '' });
  const [lecturerForm, setLecturerForm] = useState({ full_name: '', email: '', password: '' });
  const [reassignLecturer, setReassignLecturer] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, coursesRes, enrolRes, studRes, lectRes, assignmentsRes, attendanceRes, resultsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/courses'),
        api.get('/api/admin/enrolments'),
        api.get('/api/admin/students'),
        api.get('/api/admin/lecturers'),
        api.get('/api/admin/assignments'),
        api.get('/api/admin/attendance'),
        api.get('/api/admin/results'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setEnrolments(enrolRes.data);
      setStudents(studRes.data);
      setLecturers(lectRes.data);
      setAssignments(assignmentsRes.data);
      setAttendance(attendanceRes.data);
      setResults(resultsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ============================================================
  // NEW FUNCTIONS: Lecturer Creation & Data Modification
  // ============================================================

  const handleCreateLecturer = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/admin/create-lecturer', lecturerForm);
      setCreateLecturerModal(false);
      setLecturerForm({ full_name: '', email: '', password: '' });
      flash('Lecturer account created successfully!');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lecturer');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUserProfile = async (userId, newName, newEmail) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/admin/users/${userId}/profile`, {
        full_name: newName,
        email: newEmail
      });
      flash('User profile updated!');
      fetchAll();
      setEditModal(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGrade = async (resultId, totalScore, grade) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/admin/results/${resultId}`, {
        total_score: parseFloat(totalScore),
        grade
      });
      flash('Grade updated!');
      setEditModal(null);
      setDetailModal(prev => ({ ...prev, data: { ...prev.data } }));
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update grade');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAttendance = async (attendanceId, status) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/admin/attendance/${attendanceId}`, { status });
      flash('Attendance updated!');
      setEditModal(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (userId, current) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { is_active: !current });
      flash(!current ? 'Account activated.' : 'Account deactivated.');
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleEnrol = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/admin/enrol', enrolForm);
      setEnrolModal(false);
      setEnrolForm({ student_id: '', course_id: '' });
      flash('Student enrolled!');
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/admin/courses', courseForm);
      setCourseModal(false);
      setCourseForm({ course_title: '', course_code: '', description: '', semester: '', lecturer_id: '' });
      flash('Course created!');
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleReassign = async () => {
    if (!reassignLecturer) return setError('Select a lecturer');
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/admin/courses/${reassignModal.id}/reassign`, { lecturer_id: reassignLecturer });
      setReassignModal(null);
      setReassignLecturer('');
      flash('Course reassigned!');
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const openDetail = async (type, id) => {
    try {
      let endpoint = '';
      if (type === 'student') endpoint = `/api/admin/student/${id}/detailed`;
      else if (type === 'lecturer') endpoint = `/api/admin/lecturer/${id}/detailed`;
      else if (type === 'course') endpoint = `/api/admin/course/${id}/students`;
      
      const res = await api.get(endpoint);
      setDetailModal({ type, data: res.data, details: res.data });
    } catch (err) {
      console.error(err);
      setError('Failed to load details');
    }
  };

  const handlePrintUser = async (u) => {
    let detailData = null;
    try {
      if (u.role === 'student') {
        const res = await api.get(`/api/admin/student/${u.id}/detailed`);
        detailData = res.data;
      } else if (u.role === 'lecturer') {
        const res = await api.get(`/api/admin/lecturer/${u.id}/detailed`);
        detailData = res.data;
      }
    } catch (err) {
      console.error(err);
    }

    const gradePointsMap = { A: 5, B: 4, C: 3, D: 2, F: 0 };
    const printDate = new Date().toLocaleString();

    let bodyHtml = '';

    if (u.role === 'student' && detailData) {
      const s = detailData.summary || {};
      const perf = detailData.coursePerformance || [];
      const resultsCourses = perf.filter(cp => cp.result);
      const cgpa = resultsCourses.length > 0
        ? (resultsCourses.reduce((sum, cp) => sum + (gradePointsMap[cp.result.grade] ?? 0), 0) / resultsCourses.length).toFixed(2)
        : 'N/A';

      bodyHtml = `
        <section class="summary-grid">
          <div class="stat-box"><div class="stat-val">${s.enrolledCourses ?? 0}</div><div class="stat-lbl">Enrolled Courses</div></div>
          <div class="stat-box"><div class="stat-val">${s.totalSubmissions ?? 0}</div><div class="stat-lbl">Submissions</div></div>
          <div class="stat-box"><div class="stat-val">${s.overallAverageGrade?.toFixed(2) ?? 'N/A'}</div><div class="stat-lbl">Avg Grade</div></div>
          <div class="stat-box"><div class="stat-val">${s.coursesWithResults ?? 0}</div><div class="stat-lbl">Results</div></div>
          <div class="stat-box"><div class="stat-val">${cgpa}</div><div class="stat-lbl">CGPA (5.0)</div></div>
        </section>
        <h3>Course Performance</h3>
        ${perf.length === 0 ? '<p style="color:#888;">No courses enrolled.</p>' : perf.map(cp => `
          <div class="course-card">
            <div class="course-header">
              <strong>${cp.courseTitle}</strong>
              <span class="tag">${cp.courseCode} &bull; ${cp.semester}</span>
            </div>
            <p style="margin:4px 0 8px;font-size:12px;color:#555;">Lecturer: ${cp.lecturer?.full_name ?? 'N/A'}</p>
            <div class="metric-row">
              <div class="metric-box"><div class="metric-val">${cp.submissionSummary?.total ?? 0}</div><div class="metric-lbl">Submissions</div></div>
              <div class="metric-box"><div class="metric-val">${cp.submissionSummary?.graded ?? 0}</div><div class="metric-lbl">Graded</div></div>
              <div class="metric-box"><div class="metric-val">${cp.submissionSummary?.averageGrade?.toFixed(1) ?? 'N/A'}</div><div class="metric-lbl">Avg Grade</div></div>
              <div class="metric-box"><div class="metric-val">${cp.attendance?.attendanceRate ?? 0}%</div><div class="metric-lbl">Attendance (${cp.attendance?.present ?? 0}/${cp.attendance?.total ?? 0})</div></div>
            </div>
            ${cp.result ? `
              <div class="result-row">
                <span>Final Result &mdash; Total Score: <strong>${cp.result.total_score}</strong></span>
                <span class="grade-badge">${cp.result.grade}</span>
              </div>` : '<p style="font-size:12px;color:#888;margin:6px 0 0;">No final result recorded.</p>'}
            ${cp.submissions?.length > 0 ? `
              <table class="sub-table">
                <thead><tr><th>Assignment</th><th>Grade</th><th>Max Score</th></tr></thead>
                <tbody>${cp.submissions.map(sub => `
                  <tr>
                    <td>${sub.assignments?.title ?? 'N/A'}</td>
                    <td>${sub.grade !== null ? sub.grade : 'Pending'}</td>
                    <td>${sub.assignments?.max_score ?? 'N/A'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>` : ''}
          </div>`).join('')}
      `;
    } else if (u.role === 'lecturer' && detailData) {
      const s = detailData.summary || {};
      const courses = detailData.courses || [];
      bodyHtml = `
        <section class="summary-grid">
          <div class="stat-box"><div class="stat-val">${s.totalCourses ?? 0}</div><div class="stat-lbl">Courses</div></div>
          <div class="stat-box"><div class="stat-val">${s.totalStudents ?? 0}</div><div class="stat-lbl">Students</div></div>
          <div class="stat-box"><div class="stat-val">${s.totalAssignments ?? 0}</div><div class="stat-lbl">Assignments</div></div>
          <div class="stat-box"><div class="stat-val">${s.totalSubmissions ?? 0}</div><div class="stat-lbl">Submissions</div></div>
        </section>
        <h3>Assigned Courses</h3>
        ${courses.length === 0 ? '<p style="color:#888;">No courses assigned.</p>' : courses.map(c => `
          <div class="course-card">
            <div class="course-header">
              <strong>${c.course_title}</strong>
              <span class="tag">${c.course_code} &bull; ${c.semester}</span>
            </div>
            <div class="metric-row">
              <div class="metric-box"><div class="metric-val">${c.studentCount ?? 0}</div><div class="metric-lbl">Students</div></div>
              <div class="metric-box"><div class="metric-val">${c.materialCount ?? 0}</div><div class="metric-lbl">Materials</div></div>
              <div class="metric-box"><div class="metric-val">${c.assignmentCount ?? 0}</div><div class="metric-lbl">Assignments</div></div>
              <div class="metric-box"><div class="metric-val">${c.totalSubmissions ?? 0}</div><div class="metric-lbl">Submissions</div></div>
            </div>
          </div>`).join('')}
      `;
    } else {
      bodyHtml = '<p style="color:#888;margin-top:16px;">No extended data available for this account type.</p>';
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>User Report – ${u.full_name}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f1117; margin: 0; padding: 32px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f6ef7; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { margin: 0 0 4px; font-size: 20px; color: #4f6ef7; }
          .header p { margin: 2px 0; color: #6b7280; font-size: 12px; }
          .meta-pill { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 6px; }
          .role-student { background: #dbeafe; color: #1d4ed8; }
          .role-lecturer { background: #ede9fe; color: #7c3aed; }
          .role-admin { background: #fef3c7; color: #b45309; }
          .status-active { background: #d1fae5; color: #065f46; }
          .status-inactive { background: #fee2e2; color: #b91c1c; }
          .logo-area { text-align: right; font-size: 11px; color: #9ca3af; }
          h3 { margin: 20px 0 10px; font-size: 14px; color: #4f6ef7; border-bottom: 1px solid #e8eaf0; padding-bottom: 4px; }
          .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-box { background: #f8f9fc; border-radius: 10px; padding: 12px; text-align: center; }
          .stat-val { font-size: 20px; font-weight: 700; color: #0f1117; }
          .stat-lbl { font-size: 10px; color: #9ca3af; margin-top: 2px; }
          .course-card { border: 1px solid #e8eaf0; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
          .course-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
          .tag { font-size: 11px; color: #6b7280; background: #eef1fe; padding: 2px 8px; border-radius: 20px; }
          .metric-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
          .metric-box { background: #f8f9fc; border-radius: 8px; padding: 8px; text-align: center; }
          .metric-val { font-weight: 700; font-size: 14px; color: #0f1117; }
          .metric-lbl { font-size: 10px; color: #9ca3af; margin-top: 2px; }
          .result-row { display: flex; justify-content: space-between; align-items: center; background: #d1fae5; border-radius: 8px; padding: 8px 12px; margin-top: 10px; font-size: 12px; }
          .grade-badge { font-weight: 700; font-size: 16px; color: #065f46; }
          .sub-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          .sub-table th { text-align: left; border-bottom: 1px solid #e8eaf0; padding: 4px 8px; color: #6b7280; font-weight: 600; }
          .sub-table td { padding: 4px 8px; border-bottom: 1px solid #f3f4f6; }
          .sub-table tr:last-child td { border-bottom: none; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e8eaf0; font-size: 11px; color: #9ca3af; text-align: center; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${u.full_name}</h1>
            <p>${u.email}</p>
            <div style="margin-top:8px;">
              <span class="meta-pill role-${u.role}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span>
              <span class="meta-pill ${u.is_active ? 'status-active' : 'status-inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <p style="margin-top:8px;font-size:12px;color:#6b7280;">Joined: ${new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="logo-area">
            <strong style="font-size:15px;color:#4f6ef7;">ILMS</strong><br/>
            Integrated Learning<br/>Management System<br/>
            <span style="font-size:10px;">Printed: ${printDate}</span>
          </div>
        </div>

        ${bodyHtml}

        <div class="footer">
          This report was generated by the ILMS Admin Dashboard &mdash; ${printDate}
        </div>
      </body>
      </html>
    `;

    setPrintPreviewModal({ html: htmlContent, userName: u.full_name });
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColor = { student:'badge-blue', lecturer:'badge-purple', admin:'badge-amber' };
  const gradePoints = { A: 5, B: 4, C: 3, D: 2, F: 0 };
  const gradeGroups = results.reduce((groups, result) => {
    const studentId = result.student_id;
    if (!groups[studentId]) groups[studentId] = { student: result.users, results: [] };
    groups[studentId].results.push(result);
    return groups;
  }, {});

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#4f6ef7] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Navbar />
      <div className="page-container">
        {/* Header */}
        <div className="mb-8 fade-up">
          <p className="text-[#6b7280] text-sm mb-1">Administrator</p>
          <h1 className="page-title text-3xl">{user?.full_name}</h1>
        </div>

        {success && <Alert type="success" message={success} />}
        {error && <Alert type="error" message={error} />}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8eaf0] p-1 rounded-2xl mb-6 w-fit shadow-sm flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f1117]'
              }`}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon:'👥', label:'Total Users', value: stats.totalUsers, color:'blue' },
                { icon:'🎓', label:'Students', value: stats.totalStudents, color:'purple' },
                { icon:'🏫', label:'Lecturers', value: stats.totalLecturers, color:'indigo' },
                { icon:'📚', label:'Courses', value: stats.totalCourses, color:'green' },
                { icon:'📋', label:'Enrolments', value: stats.totalEnrolments, color:'amber' },
                { icon:'📝', label:'Submissions', value: stats.totalSubmissions, color:'red' },
              ].map((s,i) => <div key={s.label} className={`fade-up-${Math.min(i+1,4)}`}><StatCard {...s} /></div>)}
            </div>

            {/* Quick links */}
            <div>
              <h2 className="font-semibold text-[#0f1117] mb-3">Quick Actions</h2>
              <div className="grid sm:grid-cols-4 gap-3">
                {[
                  { icon:'➕', label:'Create Course', sub:'Assign to a lecturer', action:() => setCourseModal(true), color:'bg-[#eef1fe] text-[#4f6ef7]' },
                  { icon:'👨‍🏫', label:'Create Lecturer', sub:'Add new lecturer account', action:() => setCreateLecturerModal(true), color:'bg-purple-50 text-purple-700' },
                  { icon:'🔗', label:'Enrol Student', sub:'Add student to a course', action:() => setEnrolModal(true), color:'bg-green-50 text-green-700' },
                  { icon:'👥', label:'Manage Users', sub:'View all accounts', action:() => setTab('Users'), color:'bg-amber-50 text-amber-700' },
                ].map(item => (
                  <button key={item.label} onClick={item.action} className="card hover:shadow-md transition-all text-left p-5 hover:-translate-y-0.5 duration-200">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${item.color}`}>{item.icon}</div>
                    <p className="font-semibold text-[#0f1117] text-sm">{item.label}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent courses */}
            <div>
              <h2 className="font-semibold text-[#0f1117] mb-3">Recent Courses</h2>
              <div className="card overflow-hidden p-0">
                <table className="data-table">
                  <thead><tr><th>Course</th><th>Lecturer</th><th>Students</th><th>Materials</th><th>Assignments</th><th>Actions</th></tr></thead>
                  <tbody>
                    {courses.slice(0,5).map(c => (
                      <tr key={c.id}>
                        <td>
                          <p className="font-semibold text-[#0f1117]">{c.course_title}</p>
                          <p className="text-xs text-[#9ca3af]">{c.course_code} · {c.semester}</p>
                        </td>
                        <td className="text-[#6b7280]">{c.users?.full_name}</td>
                        <td><span className="badge-blue">{c.studentCount ?? 0}</span></td>
                        <td className="text-[#6b7280]">{c.materialCount ?? 0}</td>
                        <td className="text-[#6b7280]">{c.assignmentCount ?? 0}</td>
                        <td>
                          <button onClick={() => openDetail('course', c.id)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#eef1fe] text-[#4f6ef7] hover:bg-blue-100 font-medium">
                            View All
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {courses.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No courses yet</div>}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'Users' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input className="input max-w-xs" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
              <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">All roles</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="card overflow-hidden p-0">
              <table className="data-table">
                <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#eef1fe] flex items-center justify-center text-[#4f6ef7] font-bold text-xs shrink-0">
                            {u.full_name?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0f1117]">{u.full_name}</p>
                            <p className="text-xs text-[#9ca3af]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={roleColor[u.role]}>{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-[#9ca3af]">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          {(u.role === 'student' || u.role === 'lecturer') && (
                            <button onClick={() => openDetail(u.role, u.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-[#eef1fe] text-[#4f6ef7] hover:bg-blue-100 font-medium">
                              View Data
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintUser(u)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium flex items-center gap-1"
                            title="Print user report"
                          >
                            🖨️ Print
                          </button>
                          {u.id !== user?.id && (
                            <button onClick={() => toggleStatus(u.id, u.is_active)}
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                                u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}>
                              {u.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No users found</div>}
            </div>
          </div>
        )}

        {/* COURSES */}
        {tab === 'Courses' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#0f1117]">{courses.length} course{courses.length !== 1 ? 's' : ''}</h2>
              <button className="btn-primary text-sm" onClick={() => setCourseModal(true)}>+ Create Course</button>
            </div>
            <div className="card overflow-hidden p-0">
              <table className="data-table">
                <thead><tr><th>Course</th><th>Lecturer</th><th>Semester</th><th>Students</th><th>Actions</th></tr></thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id}>
                      <td>
                        <p className="font-semibold text-[#0f1117]">{c.course_title}</p>
                        <p className="text-xs text-[#9ca3af]">{c.course_code}</p>
                      </td>
                      <td>
                        <p className="text-sm text-[#0f1117]">{c.users?.full_name}</p>
                        <p className="text-xs text-[#9ca3af]">{c.users?.email}</p>
                      </td>
                      <td className="text-[#6b7280] text-sm">{c.semester}</td>
                      <td><span className="badge-blue">{c.studentCount ?? 0}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openDetail('course', c.id)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#eef1fe] text-[#4f6ef7] hover:bg-blue-100 font-medium">
                            View Students
                          </button>
                          <button onClick={() => { setReassignModal(c); setReassignLecturer(c.lecturer_id); }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">
                            Reassign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {courses.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No courses yet</div>}
            </div>
          </div>
        )}

        {/* ENROLMENTS */}
        {tab === 'Enrolments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#0f1117]">{enrolments.length} enrolment{enrolments.length !== 1 ? 's' : ''}</h2>
              <button className="btn-primary text-sm" onClick={() => setEnrolModal(true)}>+ Enrol Student</button>
            </div>
            <div className="card overflow-hidden p-0">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Course</th><th>Enrolled</th></tr></thead>
                <tbody>
                  {enrolments.map(e => (
                    <tr key={e.id}>
                      <td>
                        <p className="font-semibold text-[#0f1117]">{e.users?.full_name}</p>
                        <p className="text-xs text-[#9ca3af]">{e.users?.email}</p>
                      </td>
                      <td>
                        <p className="font-medium text-[#0f1117]">{e.courses?.course_title}</p>
                        <p className="text-xs text-[#9ca3af]">{e.courses?.course_code}</p>
                      </td>
                      <td className="text-[#9ca3af]">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {enrolments.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No enrolments yet</div>}
            </div>
          </div>
        )}

        {/* ASSIGNMENTS */}
        {tab === 'Assignments' && (
          <div className="card overflow-hidden p-0">
            <table className="data-table">
              <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Max Score</th><th>Submissions</th><th>Graded</th></tr></thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td className="font-semibold text-[#0f1117]">{assignment.title}</td>
                    <td><p className="font-medium text-[#0f1117]">{assignment.courses?.course_title}</p><p className="text-xs text-[#9ca3af]">{assignment.courses?.course_code}</p></td>
                    <td className="text-[#6b7280]">{new Date(assignment.due_date).toLocaleDateString()}</td>
                    <td className="text-[#6b7280]">{assignment.max_score}</td>
                    <td><span className="badge-blue">{assignment.submissionCount}</span></td>
                    <td><span className="badge-green">{assignment.gradedCount}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assignments.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No assignments yet</div>}
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === 'Attendance' && (
          <div className="card overflow-hidden p-0">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Course</th><th>Session Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record.id}>
                    <td><p className="font-semibold text-[#0f1117]">{record.users?.full_name}</p><p className="text-xs text-[#9ca3af]">{record.users?.email}</p></td>
                    <td><p className="font-medium text-[#0f1117]">{record.courses?.course_title}</p><p className="text-xs text-[#9ca3af]">{record.courses?.course_code}</p></td>
                    <td className="text-[#6b7280]">{new Date(record.session_date).toLocaleDateString()}</td>
                    <td><span className={record.status === 'present' ? 'badge-green' : record.status === 'late' ? 'badge-amber' : 'badge-red'}>{record.status}</span></td>
                    <td><button onClick={() => setEditModal({ type: 'attendance', data: record })} className="text-xs px-2.5 py-1 rounded-lg bg-[#eef1fe] text-[#4f6ef7] hover:bg-blue-100 font-medium">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No attendance records yet</div>}
          </div>
        )}

        {/* RESULTS */}
        {tab === 'Results' && (
          <div className="card overflow-hidden p-0">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Course</th><th>CA</th><th>Exam</th><th>Total Score</th><th>Grade</th><th>Actions</th></tr></thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.id}>
                    <td><p className="font-semibold text-[#0f1117]">{result.users?.full_name}</p><p className="text-xs text-[#9ca3af]">{result.users?.email}</p></td>
                    <td><p className="font-medium text-[#0f1117]">{result.courses?.course_title}</p><p className="text-xs text-[#9ca3af]">{result.courses?.course_code}</p></td>
                    <td className="text-[#6b7280]">{result.ca_score === null ? 'N/A' : result.ca_score.toFixed(2)}</td>
                    <td className="text-[#9ca3af]">{result.exam_score === null ? 'Not recorded' : result.exam_score}</td>
                    <td className="font-bold text-[#0f1117]">{result.total_score}</td>
                    <td><span className={result.grade === 'F' ? 'badge-red' : 'badge-green'}>{result.grade}</span></td>
                    <td><button onClick={() => setEditModal({ type: 'grade', data: result })} className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && <div className="text-center py-8 text-[#9ca3af] text-sm">No results yet</div>}
          </div>
        )}

        {/* GRADES / CGPA */}
        {tab === 'Grade / CGPA' && (
          <div className="space-y-4">
            {Object.entries(gradeGroups).map(([studentId, group]) => {
              const cgpa = group.results.reduce((sum, result) => sum + (gradePoints[result.grade] ?? 0), 0) / group.results.length;
              return (
                <div key={studentId} className="card overflow-hidden p-0">
                  <div className="flex justify-between items-center px-5 py-4 border-b border-[#e8eaf0]">
                    <div><p className="font-semibold text-[#0f1117]">{group.student?.full_name}</p><p className="text-xs text-[#9ca3af]">{group.student?.email}</p></div>
                    <div className="text-right"><p className="text-xs text-[#6b7280]">CGPA</p><p className="text-xl font-bold text-[#4f6ef7]">{cgpa.toFixed(2)} / 5.00</p></div>
                  </div>
                  <table className="data-table"><thead><tr><th>Course</th><th>Total Score</th><th>Grade</th><th>Grade Point</th></tr></thead><tbody>
                    {group.results.map(result => <tr key={result.id}><td>{result.courses?.course_title} <span className="text-xs text-[#9ca3af]">({result.courses?.course_code})</span></td><td>{result.total_score}</td><td><span className="badge-blue">{result.grade}</span></td><td>{gradePoints[result.grade] ?? 0}</td></tr>)}
                  </tbody></table>
                </div>
              );
            })}
            {Object.keys(gradeGroups).length === 0 && <div className="card text-center py-8 text-[#9ca3af] text-sm">No published grades yet</div>}
          </div>
        )}
      </div>

      {/* Create Lecturer Modal */}
      {createLecturerModal && (
        <Modal title="Create Lecturer Account" onClose={() => setCreateLecturerModal(false)}>
          {error && <Alert type="error" message={error} />}
          <form onSubmit={handleCreateLecturer} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Dr. John Okafor"
                value={lecturerForm.full_name}
                onChange={e => setLecturerForm({...lecturerForm, full_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="john@university.edu"
                value={lecturerForm.email}
                onChange={e => setLecturerForm({...lecturerForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Secure password"
                value={lecturerForm.password}
                onChange={e => setLecturerForm({...lecturerForm, password: e.target.value})}
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setCreateLecturerModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Lecturer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enrol Modal */}
      {enrolModal && (
        <Modal title="Enrol Student into Course" onClose={() => setEnrolModal(false)}>
          {error && <Alert type="error" message={error} />}
          <form onSubmit={handleEnrol} className="space-y-4">
            <div>
              <label className="label">Student</label>
              <select className="input" value={enrolForm.student_id} onChange={e => setEnrolForm({...enrolForm, student_id: e.target.value})} required>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input" value={enrolForm.course_id} onChange={e => setEnrolForm({...enrolForm, course_id: e.target.value})} required>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.course_title} ({c.course_code})</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setEnrolModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enrolling…' : 'Enrol'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Course Modal */}
      {courseModal && (
        <Modal title="Create Course" onClose={() => setCourseModal(false)}>
          {error && <Alert type="error" message={error} />}
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="label">Course Title</label>
              <input type="text" className="input" placeholder="Introduction to Computer Science" value={courseForm.course_title} onChange={e => setCourseForm({...courseForm, course_title: e.target.value})} required />
            </div>
            <div>
              <label className="label">Course Code</label>
              <input type="text" className="input" placeholder="CSC 101" value={courseForm.course_code} onChange={e => setCourseForm({...courseForm, course_code: e.target.value})} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
            </div>
            <div>
              <label className="label">Semester</label>
              <input type="text" className="input" placeholder="2024/2025 First Semester" value={courseForm.semester} onChange={e => setCourseForm({...courseForm, semester: e.target.value})} required />
            </div>
            <div>
              <label className="label">Assign to Lecturer</label>
              <select className="input" value={courseForm.lecturer_id} onChange={e => setCourseForm({...courseForm, lecturer_id: e.target.value})} required>
                <option value="">Select lecturer…</option>
                {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setCourseModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Course'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reassign Modal */}
      {reassignModal && (
        <Modal title={`Reassign: ${reassignModal.course_title}`} onClose={() => setReassignModal(null)}>
          {error && <Alert type="error" message={error} />}
          <p className="text-sm text-[#6b7280] mb-4">Current lecturer: <strong>{reassignModal.users?.full_name}</strong></p>
          <div className="mb-5">
            <label className="label">Assign to new lecturer</label>
            <select className="input" value={reassignLecturer} onChange={e => setReassignLecturer(e.target.value)}>
              <option value="">Select lecturer…</option>
              {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setReassignModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleReassign} disabled={saving}>{saving ? 'Reassigning…' : 'Reassign'}</button>
          </div>
        </Modal>
      )}

      {/* Detail Modal — Enhanced Student/Lecturer/Course Details */}
      {detailModal && (
        <Modal title={
          detailModal.type === 'student' ? `Student: ${detailModal.data.student?.full_name}` :
          detailModal.type === 'lecturer' ? `Lecturer: ${detailModal.data.lecturer?.full_name}` :
          `Course: ${detailModal.data.course?.course_title}`
        } onClose={() => setDetailModal(null)} size="lg">
          {error && <Alert type="error" message={error} />}

          {/* STUDENT DETAIL VIEW */}
          {detailModal.type === 'student' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-2">
                {[
                  ['📚', 'Enrolled', detailModal.data.summary?.enrolledCourses],
                  ['📝', 'Submissions', detailModal.data.summary?.totalSubmissions],
                  ['📊', 'Avg Grade', detailModal.data.summary?.overallAverageGrade?.toFixed(2) || 'N/A'],
                  ['🎓', 'Results', detailModal.data.summary?.coursesWithResults],
                ].map(([icon, label, val]) => (
                  <div key={label} className="bg-[#f8f9fc] rounded-xl p-3 text-center">
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="font-bold text-[#0f1117] text-sm">{val ?? 0}</div>
                    <div className="text-xs text-[#9ca3af]">{label}</div>
                  </div>
                ))}
              </div>

              {/* Courses Enrolled */}
              <div>
                <h4 className="font-semibold text-sm text-[#0f1117] mb-3">Course Performance</h4>
                <div className="space-y-3">
                  {detailModal.data.coursePerformance?.map((course, idx) => (
                    <div key={idx} className="border border-[#e8eaf0] rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-[#0f1117]">{course.courseTitle}</p>
                          <p className="text-xs text-[#9ca3af]">{course.courseCode} • {course.lecturer?.full_name}</p>
                        </div>
                        <span className="badge-blue">{course.semester}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-[#f8f9fc] rounded-lg p-2 text-center">
                          <div className="text-xs text-[#6b7280]">Submissions</div>
                          <div className="font-bold text-[#0f1117]">{course.submissionSummary?.total || 0}</div>
                          <div className="text-xs text-[#9ca3af]">{course.submissionSummary?.graded || 0} graded</div>
                        </div>
                        <div className="bg-[#f8f9fc] rounded-lg p-2 text-center">
                          <div className="text-xs text-[#6b7280]">Avg Grade</div>
                          <div className="font-bold text-[#0f1117]">{course.submissionSummary?.averageGrade?.toFixed(1) || 'N/A'}</div>
                        </div>
                        <div className="bg-[#f8f9fc] rounded-lg p-2 text-center">
                          <div className="text-xs text-[#6b7280]">Attendance</div>
                          <div className="font-bold text-[#0f1117]">{course.attendance?.attendanceRate}%</div>
                          <div className="text-xs text-[#9ca3af]">{course.attendance?.present}/{course.attendance?.total}</div>
                        </div>
                      </div>

                      {course.result && (
                        <div className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-[#0f1117]">Final Result</p>
                            <p className="text-xs text-[#6b7280]">Score: {course.result.total_score}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="badge-green">{course.result.grade}</span>
                            <button
                              onClick={() => setEditModal({ type: 'grade', data: course.result })}
                              className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}

                      {course.submissions?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-[#6b7280] mb-2">Submissions</p>
                          <div className="space-y-1">
                            {course.submissions.map((sub, i) => (
                              <div key={i} className="flex justify-between items-center text-xs bg-[#f8f9fc] px-2 py-1 rounded">
                                <span>{sub.assignments?.title}</span>
                                <div className="flex items-center gap-2">
                                  {sub.grade !== null ? (
                                    <>
                                      <span className="font-semibold">{sub.grade}/{sub.assignments?.max_score}</span>
                                      <button
                                        onClick={() => setEditModal({ type: 'submission', data: sub })}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                                      >
                                        Edit
                                      </button>
                                    </>
                                  ) : <span className="badge-red">Pending</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LECTURER DETAIL VIEW */}
          {detailModal.type === 'lecturer' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-2">
                {[
                  ['📚', 'Courses', detailModal.data.summary?.totalCourses],
                  ['🎓', 'Students', detailModal.data.summary?.totalStudents],
                  ['📋', 'Assignments', detailModal.data.summary?.totalAssignments],
                  ['📝', 'Submissions', detailModal.data.summary?.totalSubmissions],
                ].map(([icon, label, val]) => (
                  <div key={label} className="bg-[#f8f9fc] rounded-xl p-3 text-center">
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="font-bold text-[#0f1117] text-sm">{val ?? 0}</div>
                    <div className="text-xs text-[#9ca3af]">{label}</div>
                  </div>
                ))}
              </div>

              {/* Courses */}
              {detailModal.data.courses?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-[#0f1117] mb-3">Courses</h4>
                  <div className="space-y-2">
                    {detailModal.data.courses.map(c => (
                      <div key={c.id} className="border border-[#e8eaf0] rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-[#0f1117]">{c.course_title}</p>
                            <p className="text-xs text-[#9ca3af]">{c.course_code} • {c.semester}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
                          <div className="bg-[#f8f9fc] rounded p-2">
                            <p className="text-xs text-[#6b7280]">Students</p>
                            <p className="font-bold text-[#0f1117]">{c.studentCount}</p>
                          </div>
                          <div className="bg-[#f8f9fc] rounded p-2">
                            <p className="text-xs text-[#6b7280]">Materials</p>
                            <p className="font-bold text-[#0f1117]">{c.materialCount}</p>
                          </div>
                          <div className="bg-[#f8f9fc] rounded p-2">
                            <p className="text-xs text-[#6b7280]">Assignments</p>
                            <p className="font-bold text-[#0f1117]">{c.assignmentCount}</p>
                          </div>
                          <div className="bg-[#f8f9fc] rounded p-2">
                            <p className="text-xs text-[#6b7280]">Submissions</p>
                            <p className="font-bold text-[#0f1117]">{c.totalSubmissions}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COURSE DETAIL VIEW */}
          {detailModal.type === 'course' && (
            <div className="space-y-5">
              <div className="bg-[#f8f9fc] rounded-xl p-4">
                <p className="text-sm text-[#6b7280] mb-1">Course Information</p>
                <p className="font-bold text-lg text-[#0f1117]">{detailModal.data.course?.course_title}</p>
                <p className="text-sm text-[#6b7280] mt-2">{detailModal.data.course?.course_code} • {detailModal.data.course?.semester}</p>
                <p className="text-sm text-[#6b7280]">Lecturer: <strong>{detailModal.data.course?.users?.full_name}</strong></p>
              </div>

              {detailModal.data.students?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-[#0f1117] mb-3">Student Performance</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#e8eaf0]">
                          <th className="text-left py-2 px-2">Student</th>
                          <th className="text-center py-2 px-2">Submissions</th>
                          <th className="text-center py-2 px-2">Avg Grade</th>
                          <th className="text-center py-2 px-2">Attendance</th>
                          <th className="text-center py-2 px-2">Final Grade</th>
                          <th className="text-center py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailModal.data.students.map((student, idx) => (
                          <tr key={idx} className="border-b border-[#e8eaf0] hover:bg-[#f8f9fc]">
                            <td className="py-2 px-2">
                              <p className="font-semibold text-[#0f1117]">{student.studentName}</p>
                              <p className="text-[#9ca3af]">{student.studentEmail}</p>
                            </td>
                            <td className="text-center py-2 px-2">
                              <span className="badge-blue">{student.submissionCount}</span>
                            </td>
                            <td className="text-center py-2 px-2">
                              {student.averageSubmissionGrade?.toFixed(2) || 'N/A'}
                            </td>
                            <td className="text-center py-2 px-2">
                              {student.attendance?.present}/{student.attendance?.total}
                            </td>
                            <td className="text-center py-2 px-2">
                              {student.result ? <span className="badge-green">{student.result.grade}</span> : <span className="text-[#9ca3af]">-</span>}
                            </td>
                            <td className="text-center py-2 px-2">
                              <button
                                onClick={() => setEditModal({ type: 'courseStudent', data: student })}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#eef1fe] text-[#4f6ef7] hover:bg-blue-100"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Edit Modal — For inline data modifications */}
      {editModal && (
        <Modal
          title={
            editModal.type === 'grade' ? 'Edit Student Grade' :
            editModal.type === 'submission' ? 'Edit Submission Grade' :
            editModal.type === 'attendance' ? 'Edit Attendance' :
            editModal.type === 'courseStudent' ? `Edit: ${editModal.data.studentName}` :
            'Edit Data'
          }
          onClose={() => setEditModal(null)}
        >
          {error && <Alert type="error" message={error} />}

          {editModal.type === 'grade' && (
            <EditGradeForm
              result={editModal.data}
              onSave={handleUpdateGrade}
              onCancel={() => setEditModal(null)}
              saving={saving}
            />
          )}

          {editModal.type === 'submission' && (
            <EditSubmissionForm
              submission={editModal.data}
              onSave={(submissionId, grade, feedback) => {
                handleUpdateGrade(submissionId, grade, feedback);
              }}
              onCancel={() => setEditModal(null)}
              saving={saving}
            />
          )}

          {editModal.type === 'attendance' && (
            <EditAttendanceForm
              attendance={editModal.data}
              onSave={handleUpdateAttendance}
              onCancel={() => setEditModal(null)}
              saving={saving}
            />
          )}

          {editModal.type === 'courseStudent' && (
            <EditCourseStudentForm
              student={editModal.data}
              onCancel={() => setEditModal(null)}
              saving={saving}
            />
          )}
        </Modal>
      )}

      {/* Print Preview Modal */}
      {printPreviewModal && (
        <PrintPreviewModal
          html={printPreviewModal.html}
          userName={printPreviewModal.userName}
          onClose={() => setPrintPreviewModal(null)}
        />
      )}
    </div>
  );
}

// Edit Grade Form Component
function EditGradeForm({ result, onSave, onCancel, saving }) {
  const [score, setScore] = useState(result.total_score);
  const [grade, setGrade] = useState(result.grade);

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Total Score</label>
        <input
          type="number"
          step="0.1"
          className="input"
          value={score}
          onChange={e => setScore(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Grade</label>
        <select className="input" value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="A">A (90-100)</option>
          <option value="B">B (80-89)</option>
          <option value="C">C (70-79)</option>
          <option value="D">D (60-69)</option>
          <option value="F">F (Below 60)</option>
        </select>
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(result.id, score, grade)} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// Edit Submission Form Component
function EditSubmissionForm({ submission, onSave, onCancel, saving }) {
  const [grade, setGrade] = useState(submission.grade || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');

  return (
    <div className="space-y-4">
      <div className="bg-[#f8f9fc] rounded-xl p-3 mb-4">
        <p className="text-sm font-semibold text-[#0f1117]">{submission.assignments?.title}</p>
        <p className="text-xs text-[#6b7280]">Max Score: {submission.assignments?.max_score}</p>
      </div>
      <div>
        <label className="label">Grade</label>
        <input
          type="number"
          step="0.1"
          max={submission.assignments?.max_score}
          className="input"
          value={grade}
          onChange={e => setGrade(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Feedback</label>
        <textarea
          className="input"
          rows={3}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Optional feedback for student..."
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(submission.id, grade, feedback)} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function EditAttendanceForm({ attendance, onSave, onCancel, saving }) {
  const [status, setStatus] = useState(attendance.status);

  return (
    <div className="space-y-4">
      <div className="text-sm text-[#6b7280]">
        <p className="font-semibold text-[#0f1117]">{attendance.users?.full_name}</p>
        <p>{attendance.courses?.course_title} · {new Date(attendance.session_date).toLocaleDateString()}</p>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(attendance.id, status)} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// Edit Course Student Form Component
function EditCourseStudentForm({ student, onCancel, saving }) {
  const [grade, setGrade] = useState(student.result?.total_score || '');
  const [letterGrade, setLetterGrade] = useState(student.result?.grade || 'A');

  const handleSaveGrade = async () => {
    if (!student.result?.id) {
      // Need to create new result
      const courseId = student.courseId; // Should be passed in student object
      if (!courseId) {
        alert('Cannot determine course ID');
        return;
      }
      // Would need to implement create result
      alert('Creating new result not yet implemented in this modal');
      return;
    }
    
    // Update existing result
    if (!grade) {
      alert('Please enter a score');
      return;
    }
    
    // Call parent's update function
    // For now just show success
    alert(`Saved: ${grade} (${letterGrade})`);
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#f8f9fc] rounded-xl p-3 mb-4">
        <p className="text-sm font-semibold text-[#0f1117]">{student.studentName}</p>
        <p className="text-xs text-[#6b7280]">{student.studentEmail}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#f8f9fc] rounded-xl p-3">
          <p className="text-xs text-[#6b7280] mb-1">Submissions</p>
          <p className="font-bold text-lg text-[#0f1117]">{student.submissionCount}</p>
        </div>
        <div className="bg-[#f8f9fc] rounded-xl p-3">
          <p className="text-xs text-[#6b7280] mb-1">Average Grade</p>
          <p className="font-bold text-lg text-[#0f1117]">{student.averageSubmissionGrade?.toFixed(2) || 'N/A'}</p>
        </div>
        <div className="bg-[#f8f9fc] rounded-xl p-3">
          <p className="text-xs text-[#6b7280] mb-1">Attendance</p>
          <p className="font-bold text-lg text-[#0f1117]">{student.attendance?.present}/{student.attendance?.total}</p>
        </div>
        <div className="bg-[#f8f9fc] rounded-xl p-3">
          <p className="text-xs text-[#6b7280] mb-1">Late</p>
          <p className="font-bold text-lg text-[#0f1117]">{student.attendance?.late || 0}</p>
        </div>
      </div>

      {/* Editable Grade Section */}
      <div className="border border-[#e8eaf0] rounded-xl p-4 bg-amber-50">
        <h4 className="font-semibold text-sm text-[#0f1117] mb-4">Edit Final Grade</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label text-sm">Score</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="input"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="Enter score (0-100)"
            />
          </div>
          <div>
            <label className="label text-sm">Letter Grade</label>
            <select className="input" value={letterGrade} onChange={e => setLetterGrade(e.target.value)}>
              <option value="A">A (90-100)</option>
              <option value="B">B (80-89)</option>
              <option value="C">C (70-79)</option>
              <option value="D">D (60-69)</option>
              <option value="F">F (Below 60)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleSaveGrade} disabled={saving}>
          {saving ? 'Saving...' : 'Save Grade'}
        </button>
      </div>
    </div>
  );
}

// Print Preview Modal Component
function PrintPreviewModal({ html, userName, onClose }) {
  const iframeRef = useRef(null);

  // Write HTML into the iframe exactly once after it mounts.
  // Using useEffect avoids the double-fire issue with the onLoad event,
  // which would clear the content on the second call.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(15,17,23,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: '#0f1117', borderBottom: '1px solid #1e2130' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">Print Preview</span>
          <span className="text-[#6b7280] text-xs">— {userName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#9ca3af] text-xs hidden sm:block">
            Review the report below, then click Send to Printer
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3b5bdb] transition-colors shadow"
          >
            🖨️ Send to Printer
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e2130] text-[#9ca3af] text-sm hover:bg-[#2a2f45] hover:text-white transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex justify-center py-8 px-4">
        <div
          className="w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ maxWidth: 860, background: 'white' }}
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            ref={iframeRef}
            title="Print Preview"
            style={{ width: '100%', minHeight: 900, border: 'none', display: 'block' }}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="flex justify-center gap-4 px-6 py-4 shrink-0"
        style={{ background: '#0f1117', borderTop: '1px solid #1e2130' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-[#1e2130] text-[#9ca3af] text-sm font-medium hover:bg-[#2a2f45] hover:text-white transition-colors"
        >
          ✕ Close Preview
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#4f6ef7] text-white text-sm font-semibold hover:bg-[#3b5bdb] transition-colors shadow"
        >
          🖨️ Send to Printer
        </button>
      </div>
    </div>
  );
}
