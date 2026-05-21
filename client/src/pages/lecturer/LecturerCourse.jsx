import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { uploadFile } from '../../lib/uploadFile';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

const TABS = ['Materials','Assignments','Attendance','Results'];

export default function LecturerCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Materials');
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [matModal, setMatModal] = useState(false);
  const [asnModal, setAsnModal] = useState(false);
  const [attModal, setAttModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(null);
  const [resultModal, setResultModal] = useState(false);
  const [matForm, setMatForm] = useState({ title: '', week_number: '', file: null });
  const [asnForm, setAsnForm] = useState({ title: '', instructions: '', due_date: '', max_score: '' });
  const [attendDate, setAttendDate] = useState('');
  const [attendRecords, setAttendRecords] = useState([]);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [resultForm, setResultForm] = useState({ student_id: '', total_score: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAll(); }, [courseId]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const fetchAll = async () => {
    try {
      const [matRes, asnRes, studRes, resRes] = await Promise.all([
        api.get(`/api/courses/${courseId}/content`),
        api.get(`/api/assignments/course/${courseId}`),
        api.get(`/api/courses/${courseId}/students`),
        api.get(`/api/results/course/${courseId}`)
      ]);
      setMaterials(matRes.data);
      setAssignments(asnRes.data);
      setStudents(studRes.data);
      setResults(resRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openSubmissions = async (a) => {
    setSelectedAssignment(a);
    const res = await api.get(`/api/assignments/${a.id}/submissions`);
    setSubmissions(res.data);
  };

  const handleMaterial = async (e) => {
    e.preventDefault();
    if (!matForm.file) return setError('Please select a file');
    setSaving(true); setError('');
    try {
      const fileUrl = await uploadFile(matForm.file, 'course-materials');
      await api.post(`/api/courses/${courseId}/content`, { title: matForm.title, file_url: fileUrl, week_number: parseInt(matForm.week_number) });
      setMatModal(false); setMatForm({ title: '', week_number: '', file: null });
      flash('Material uploaded!'); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Upload failed'); }
    finally { setSaving(false); }
  };

  const handleAssignment = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/api/assignments', { course_id: courseId, ...asnForm, max_score: parseInt(asnForm.max_score) });
      setAsnModal(false); setAsnForm({ title: '', instructions: '', due_date: '', max_score: '' });
      flash('Assignment created!'); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const openAttendance = () => {
    setAttendDate(new Date().toISOString().split('T')[0]);
    setAttendRecords(students.map(s => ({ student_id: s.users.id, status: 'present', name: s.users.full_name })));
    setAttModal(true);
  };

  const handleAttendance = async () => {
    if (!attendDate) return setError('Select a date');
    setSaving(true); setError('');
    try {
      await api.post('/api/attendance/record', { course_id: courseId, session_date: attendDate, records: attendRecords.map(r => ({ student_id: r.student_id, status: r.status })) });
      setAttModal(false); flash('Attendance recorded!');
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleGrade = async () => {
    if (gradeForm.grade === '') return setError('Enter a grade');
    setSaving(true); setError('');
    try {
      await api.patch(`/api/assignments/submissions/${gradeModal.id}/grade`, { grade: parseFloat(gradeForm.grade), feedback: gradeForm.feedback });
      setGradeModal(null); setGradeForm({ grade: '', feedback: '' });
      flash('Graded!'); openSubmissions(selectedAssignment);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleResult = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/api/results', { course_id: courseId, ...resultForm, total_score: parseFloat(resultForm.total_score) });
      setResultModal(false); setResultForm({ student_id: '', total_score: '', grade: '' });
      flash('Result published!'); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#4f6ef7] border-t-transparent animate-spin" /></div>;

  const gradeColor = (g) => ({ A:'badge-green', B:'badge-blue', C:'badge-amber' }[g] || 'badge-gray');

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Navbar />
      <div className="page-container">
        <button onClick={() => navigate('/lecturer')} className="btn-ghost mb-5 -ml-2 text-sm">← Back</button>
        {success && <Alert type="success" message={success} />}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="page-title">Course Management</h1>
            <p className="text-[#9ca3af] text-sm mt-1">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8eaf0] p-1 rounded-2xl mb-6 w-fit shadow-sm flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setSelectedAssignment(null); }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f1117]'
              }`}>{t}</button>
          ))}
        </div>

        {/* MATERIALS */}
        {tab === 'Materials' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#0f1117]">Course Materials</h2>
              <button className="btn-primary text-sm" onClick={() => setMatModal(true)}>+ Upload</button>
            </div>
            {materials.length === 0
              ? <EmptyState icon="📂" title="No materials yet" subtitle="Upload lecture notes, slides, or other resources." action={<button className="btn-primary" onClick={() => setMatModal(true)}>Upload Material</button>} />
              : <div className="space-y-3">
                  {materials.map(m => (
                    <div key={m.id} className="card flex items-center gap-4 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">📄</div>
                        <div>
                          <p className="font-semibold text-[#0f1117]">{m.title}</p>
                          <p className="text-xs text-[#9ca3af]">Week {m.week_number} · {new Date(m.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm shrink-0">Download</a>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ASSIGNMENTS */}
        {tab === 'Assignments' && !selectedAssignment && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#0f1117]">Assignments</h2>
              <button className="btn-primary text-sm" onClick={() => setAsnModal(true)}>+ New Assignment</button>
            </div>
            {assignments.length === 0
              ? <EmptyState icon="📝" title="No assignments" subtitle="Create assignments for your students." action={<button className="btn-primary" onClick={() => setAsnModal(true)}>Create Assignment</button>} />
              : <div className="space-y-3">
                  {assignments.map(a => {
                    const isPast = new Date(a.due_date) < new Date();
                    return (
                      <div key={a.id} className="card flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#0f1117]">{a.title}</p>
                            {isPast ? <span className="badge-gray text-[10px]">Closed</span> : <span className="badge-green text-[10px]">Open</span>}
                          </div>
                          {a.instructions && <p className="text-sm text-[#6b7280]">{a.instructions}</p>}
                          <div className="flex gap-3 mt-1.5 text-xs text-[#9ca3af]">
                            <span>📅 Due {new Date(a.due_date).toLocaleDateString()}</span>
                            <span>🎯 {a.max_score} pts</span>
                          </div>
                        </div>
                        <button className="btn-secondary text-sm shrink-0" onClick={() => openSubmissions(a)}>Submissions →</button>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* SUBMISSIONS view */}
        {tab === 'Assignments' && selectedAssignment && (
          <div>
            <button onClick={() => setSelectedAssignment(null)} className="btn-ghost mb-4 -ml-2 text-sm">← All assignments</button>
            <h2 className="font-semibold text-[#0f1117] mb-1">{selectedAssignment.title}</h2>
            <p className="text-sm text-[#9ca3af] mb-4">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
            {submissions.length === 0
              ? <EmptyState icon="📬" title="No submissions yet" subtitle="Students haven't submitted yet." />
              : <div className="space-y-3">
                  {submissions.map(s => (
                    <div key={s.id} className="card">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#eef1fe] flex items-center justify-center font-bold text-[#4f6ef7] text-sm shrink-0">
                            {s.users?.full_name?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0f1117]">{s.users?.full_name}</p>
                            <p className="text-xs text-[#9ca3af]">{new Date(s.submitted_at).toLocaleString()}</p>
                            {s.grade !== null && (
                              <p className="text-xs font-semibold text-green-600 mt-0.5">Graded: {s.grade}/{selectedAssignment.max_score}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">View</a>
                          <button className="btn-primary text-xs" onClick={() => { setGradeModal(s); setGradeForm({ grade: s.grade ?? '', feedback: s.feedback ?? '' }); }}>
                            {s.grade !== null ? 'Re-grade' : 'Grade'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === 'Attendance' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#0f1117]">Attendance</h2>
              <button className="btn-primary text-sm" onClick={openAttendance} disabled={students.length === 0}>Record Session</button>
            </div>
            {students.length === 0
              ? <EmptyState icon="🎓" title="No students enrolled" subtitle="Students need to enrol before you can record attendance." />
              : <div className="card">
                  <p className="text-sm text-[#6b7280] mb-4">Click "Record Session" to mark attendance for a class session.</p>
                  <div className="space-y-2">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-[#f8f9fc] last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">{s.users?.full_name?.[0]}</div>
                        <div>
                          <p className="text-sm font-semibold text-[#0f1117]">{s.users?.full_name}</p>
                          <p className="text-xs text-[#9ca3af]">{s.users?.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            }
          </div>
        )}

        {/* RESULTS */}
        {tab === 'Results' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-[#0f1117]">Published Results</h2>
              <button className="btn-primary text-sm" onClick={() => setResultModal(true)} disabled={students.length === 0}>+ Publish Result</button>
            </div>
            {results.length === 0
              ? <EmptyState icon="🏆" title="No results published" subtitle="Publish final results for your students." action={<button className="btn-primary" onClick={() => setResultModal(true)} disabled={students.length === 0}>Publish Result</button>} />
              : <div className="card overflow-hidden p-0">
                  <table className="data-table">
                    <thead><tr><th>Student</th><th>Score</th><th>Grade</th><th>Published</th></tr></thead>
                    <tbody>
                      {results.map(r => (
                        <tr key={r.id}>
                          <td>
                            <p className="font-semibold text-[#0f1117]">{r.users?.full_name}</p>
                            <p className="text-xs text-[#9ca3af]">{r.users?.email}</p>
                          </td>
                          <td className="font-bold">{r.total_score}</td>
                          <td><span className={gradeColor(r.grade)}>{r.grade}</span></td>
                          <td className="text-[#9ca3af]">{new Date(r.published_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}
      </div>

      {/* Modals */}
      {matModal && (
        <Modal title="Upload Course Material" onClose={() => setMatModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleMaterial} className="space-y-4">
            <div><label className="label">Title</label><input type="text" className="input" value={matForm.title} onChange={e => setMatForm({...matForm, title: e.target.value})} required /></div>
            <div><label className="label">Week Number</label><input type="number" className="input" min="1" value={matForm.week_number} onChange={e => setMatForm({...matForm, week_number: e.target.value})} required /></div>
            <div><label className="label">File</label><input type="file" className="input" onChange={e => setMatForm({...matForm, file: e.target.files[0]})} required /></div>
            <div className="flex gap-3 justify-end"><button type="button" className="btn-secondary" onClick={() => setMatModal(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button></div>
          </form>
        </Modal>
      )}
      {asnModal && (
        <Modal title="Create Assignment" onClose={() => setAsnModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleAssignment} className="space-y-4">
            <div><label className="label">Title</label><input type="text" className="input" value={asnForm.title} onChange={e => setAsnForm({...asnForm, title: e.target.value})} required /></div>
            <div><label className="label">Instructions</label><textarea className="input" rows={3} value={asnForm.instructions} onChange={e => setAsnForm({...asnForm, instructions: e.target.value})} /></div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={asnForm.due_date} onChange={e => setAsnForm({...asnForm, due_date: e.target.value})} required /></div>
            <div><label className="label">Max Score</label><input type="number" className="input" min="1" value={asnForm.max_score} onChange={e => setAsnForm({...asnForm, max_score: e.target.value})} required /></div>
            <div className="flex gap-3 justify-end"><button type="button" className="btn-secondary" onClick={() => setAsnModal(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button></div>
          </form>
        </Modal>
      )}
      {attModal && (
        <Modal title="Record Attendance" onClose={() => setAttModal(false)}>
          <Alert type="error" message={error} />
          <div className="mb-4"><label className="label">Session Date</label><input type="date" className="input" value={attendDate} onChange={e => setAttendDate(e.target.value)} /></div>
          <div className="space-y-2 max-h-64 overflow-y-auto mb-5 pr-1">
            {attendRecords.map((r, i) => (
              <div key={r.student_id} className="flex items-center justify-between py-2 border-b border-[#f8f9fc]">
                <span className="text-sm font-medium text-[#0f1117]">{r.name}</span>
                <div className="flex gap-1">
                  {['present','absent','late'].map(s => (
                    <button key={s} type="button" onClick={() => { const u=[...attendRecords]; u[i]={...r,status:s}; setAttendRecords(u); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                        r.status===s ? (s==='present'?'bg-green-500 text-white':s==='absent'?'bg-red-500 text-white':'bg-amber-500 text-white') : 'bg-[#f8f9fc] text-[#6b7280] hover:bg-[#e8eaf0]'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end"><button className="btn-secondary" onClick={() => setAttModal(false)}>Cancel</button><button className="btn-primary" onClick={handleAttendance} disabled={saving}>{saving ? 'Saving…' : 'Save Attendance'}</button></div>
        </Modal>
      )}
      {gradeModal && (
        <Modal title={`Grade: ${gradeModal.users?.full_name}`} onClose={() => setGradeModal(null)}>
          <Alert type="error" message={error} />
          <div className="space-y-4">
            <div><label className="label">Score (out of {selectedAssignment?.max_score})</label><input type="number" className="input" min="0" max={selectedAssignment?.max_score} value={gradeForm.grade} onChange={e => setGradeForm({...gradeForm, grade: e.target.value})} /></div>
            <div><label className="label">Feedback (optional)</label><textarea className="input" rows={3} value={gradeForm.feedback} onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} /></div>
            <div className="flex gap-3 justify-end"><button className="btn-secondary" onClick={() => setGradeModal(null)}>Cancel</button><button className="btn-primary" onClick={handleGrade} disabled={saving}>{saving ? 'Saving…' : 'Save Grade'}</button></div>
          </div>
        </Modal>
      )}
      {resultModal && (
        <Modal title="Publish Final Result" onClose={() => setResultModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleResult} className="space-y-4">
            <div><label className="label">Student</label>
              <select className="input" value={resultForm.student_id} onChange={e => setResultForm({...resultForm, student_id: e.target.value})} required>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.users.id} value={s.users.id}>{s.users.full_name}</option>)}
              </select>
            </div>
            <div><label className="label">Total Score</label><input type="number" className="input" min="0" value={resultForm.total_score} onChange={e => setResultForm({...resultForm, total_score: e.target.value})} required /></div>
            <div><label className="label">Grade</label>
              <select className="input" value={resultForm.grade} onChange={e => setResultForm({...resultForm, grade: e.target.value})} required>
                <option value="">Select…</option>
                {['A','B','C','D','E','F'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end"><button type="button" className="btn-secondary" onClick={() => setResultModal(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
