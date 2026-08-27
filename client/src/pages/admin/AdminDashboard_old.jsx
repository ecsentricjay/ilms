import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

const TABS = ['Overview','Users','Courses','Enrolments'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolments, setEnrolments] = useState([]);
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
  const [lecturerEnrolModal, setLecturerEnrolModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // { type: 'student'|'lecturer', data }

  const [enrolForm, setEnrolForm] = useState({ student_id: '', course_id: '' });
  const [courseForm, setCourseForm] = useState({ course_title: '', course_code: '', description: '', semester: '', lecturer_id: '' });
  const [reassignLecturer, setReassignLecturer] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, coursesRes, enrolRes, studRes, lectRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/courses'),
        api.get('/api/admin/enrolments'),
        api.get('/api/admin/students'),
        api.get('/api/admin/lecturers'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setEnrolments(enrolRes.data);
      setStudents(studRes.data);
      setLecturers(lectRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (userId, current) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { is_active: !current });
      flash(!current ? 'Account activated.' : 'Account deactivated.');
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleEnrol = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/api/admin/enrol', enrolForm);
      setEnrolModal(false); setEnrolForm({ student_id: '', course_id: '' });
      flash('Student enrolled!'); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/api/admin/courses', courseForm);
      setCourseModal(false); setCourseForm({ course_title: '', course_code: '', description: '', semester: '', lecturer_id: '' });
      flash('Course created!'); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleReassign = async () => {
    if (!reassignLecturer) return setError('Select a lecturer');
    setSaving(true); setError('');
    try {
      await api.patch(`/api/admin/courses/${reassignModal.id}/reassign`, { lecturer_id: reassignLecturer });
      setReassignModal(null); setReassignLecturer('');
      flash('Course reassigned!'); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const openDetail = async (type, id) => {
    try {
      const endpoint = type === 'student' ? `/api/admin/student/${id}/stats` : `/api/admin/lecturer/${id}/stats`;
      const res = await api.get(endpoint);
      setDetailModal({ type, data: res.data });
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColor = { student:'badge-blue', lecturer:'badge-purple', admin:'badge-amber' };

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
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon:'➕', label:'Create Course', sub:'Assign to a lecturer', action:() => setCourseModal(true), color:'bg-[#eef1fe] text-[#4f6ef7]' },
                  { icon:'🔗', label:'Enrol Student', sub:'Add student to a course', action:() => setEnrolModal(true), color:'bg-green-50 text-green-700' },
                  { icon:'👥', label:'Manage Users', sub:'View all accounts', action:() => setTab('Users'), color:'bg-purple-50 text-purple-700' },
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
                  <thead><tr><th>Course</th><th>Lecturer</th><th>Students</th><th>Materials</th><th>Assignments</th></tr></thead>
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
                        <div className="flex gap-2">
                          {(u.role === 'student' || u.role === 'lecturer') && (
                            <button onClick={() => openDetail(u.role, u.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-[#eef1fe] text-[#4f6ef7] hover:bg-blue-100 font-medium">
                              View Stats
                            </button>
                          )}
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
                        <button onClick={() => { setReassignModal(c); setReassignLecturer(c.lecturer_id); }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">
                          Reassign
                        </button>
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
      </div>

      {/* Enrol Modal */}
      {enrolModal && (
        <Modal title="Enrol Student into Course" onClose={() => setEnrolModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleEnrol} className="space-y-4">
            <div><label className="label">Student</label>
              <select className="input" value={enrolForm.student_id} onChange={e => setEnrolForm({...enrolForm, student_id: e.target.value})} required>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </div>
            <div><label className="label">Course</label>
              <select className="input" value={enrolForm.course_id} onChange={e => setEnrolForm({...enrolForm, course_id: e.target.value})} required>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.course_title} ({c.course_code})</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end"><button type="button" className="btn-secondary" onClick={() => setEnrolModal(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enrolling…' : 'Enrol'}</button></div>
          </form>
        </Modal>
      )}

      {/* Create Course Modal */}
      {courseModal && (
        <Modal title="Create Course" onClose={() => setCourseModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div><label className="label">Course Title</label><input type="text" className="input" placeholder="Introduction to Computer Science" value={courseForm.course_title} onChange={e => setCourseForm({...courseForm, course_title: e.target.value})} required /></div>
            <div><label className="label">Course Code</label><input type="text" className="input" placeholder="CSC 101" value={courseForm.course_code} onChange={e => setCourseForm({...courseForm, course_code: e.target.value})} required /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} /></div>
            <div><label className="label">Semester</label><input type="text" className="input" placeholder="2024/2025 First Semester" value={courseForm.semester} onChange={e => setCourseForm({...courseForm, semester: e.target.value})} required /></div>
            <div><label className="label">Assign to Lecturer</label>
              <select className="input" value={courseForm.lecturer_id} onChange={e => setCourseForm({...courseForm, lecturer_id: e.target.value})} required>
                <option value="">Select lecturer…</option>
                {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end"><button type="button" className="btn-secondary" onClick={() => setCourseModal(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Course'}</button></div>
          </form>
        </Modal>
      )}

      {/* Reassign Modal */}
      {reassignModal && (
        <Modal title={`Reassign: ${reassignModal.course_title}`} onClose={() => setReassignModal(null)}>
          <Alert type="error" message={error} />
          <p className="text-sm text-[#6b7280] mb-4">Current lecturer: <strong>{reassignModal.users?.full_name}</strong></p>
          <div className="mb-5"><label className="label">Assign to new lecturer</label>
            <select className="input" value={reassignLecturer} onChange={e => setReassignLecturer(e.target.value)}>
              <option value="">Select lecturer…</option>
              {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end"><button className="btn-secondary" onClick={() => setReassignModal(null)}>Cancel</button><button className="btn-primary" onClick={handleReassign} disabled={saving}>{saving ? 'Reassigning…' : 'Reassign'}</button></div>
        </Modal>
      )}

      {/* Detail Modal — Student or Lecturer stats */}
      {detailModal && (
        <Modal title={detailModal.type === 'student' ? `Student: ${detailModal.data.student?.full_name}` : `Lecturer: ${detailModal.data.lecturer?.full_name}`} onClose={() => setDetailModal(null)} size="lg">
          {detailModal.type === 'student' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['📚','Courses', detailModal.data.enrolments?.length],
                  ['📝','Submissions', detailModal.data.submissions?.length],
                  ['🏆','Results', detailModal.data.results?.length],
                ].map(([icon,label,val]) => (
                  <div key={label} className="bg-[#f8f9fc] rounded-xl p-4 text-center">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="font-bold text-[#0f1117] text-xl">{val ?? 0}</div>
                    <div className="text-xs text-[#9ca3af]">{label}</div>
                  </div>
                ))}
              </div>
              {detailModal.data.enrolments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-[#0f1117] mb-2">Enrolled Courses</h4>
                  <div className="space-y-2">
                    {detailModal.data.enrolments.map(e => (
                      <div key={e.id} className="flex items-center justify-between bg-[#f8f9fc] rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[#0f1117]">{e.courses?.course_title}</p>
                          <p className="text-xs text-[#9ca3af]">{e.courses?.course_code} · {e.courses?.users?.full_name}</p>
                        </div>
                        <span className="badge-blue text-[10px]">{e.courses?.semester}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailModal.data.attendance?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-[#0f1117] mb-2">Attendance Summary</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['present','absent','late'].map(s => {
                      const count = detailModal.data.attendance.filter(a => a.status===s).length;
                      return <div key={s} className="bg-[#f8f9fc] rounded-xl p-3 text-center"><div className="font-bold text-[#0f1117]">{count}</div><div className="text-xs text-[#9ca3af] capitalize">{s}</div></div>;
                    })}
                  </div>
                </div>
              )}
              {detailModal.data.results?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-[#0f1117] mb-2">Results</h4>
                  <div className="space-y-2">
                    {detailModal.data.results.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-[#f8f9fc] rounded-xl px-4 py-3">
                        <p className="text-sm font-medium text-[#0f1117]">{r.courses?.course_title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#0f1117]">{r.total_score}</span>
                          <span className="badge-green">{r.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {detailModal.type === 'lecturer' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['📚','Courses', detailModal.data.courses?.length],
                  ['🎓','Total Students', detailModal.data.courses?.reduce((a,c) => a+(c.enrolments?.[0]?.count||0),0)],
                  ['📝','Assignments', detailModal.data.courses?.reduce((a,c) => a+(c.assignments?.[0]?.count||0),0)],
                ].map(([icon,label,val]) => (
                  <div key={label} className="bg-[#f8f9fc] rounded-xl p-4 text-center">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="font-bold text-[#0f1117] text-xl">{val ?? 0}</div>
                    <div className="text-xs text-[#9ca3af]">{label}</div>
                  </div>
                ))}
              </div>
              {detailModal.data.courses?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-[#0f1117] mb-2">Courses</h4>
                  <div className="space-y-2">
                    {detailModal.data.courses.map(c => (
                      <div key={c.id} className="bg-[#f8f9fc] rounded-xl px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#0f1117]">{c.course_title}</p>
                            <p className="text-xs text-[#9ca3af]">{c.course_code} · {c.semester}</p>
                          </div>
                          <span className="badge-purple">{c.course_code}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
