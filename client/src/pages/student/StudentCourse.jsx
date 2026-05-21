import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { uploadFile } from '../../lib/uploadFile';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

const TABS = ['Materials','Assignments','Attendance'];

export default function StudentCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Materials');
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => { fetchAll(); }, [courseId]);

  const fetchAll = async () => {
    try {
      const [matRes, asnRes, attRes] = await Promise.all([
        api.get(`/api/courses/${courseId}/content`),
        api.get(`/api/assignments/course/${courseId}`),
        api.get(`/api/attendance/course/${courseId}/student`)
      ]);
      setMaterials(matRes.data);
      setAssignments(asnRes.data);
      setAttendance(attRes.data);
      const subMap = {};
      await Promise.all(asnRes.data.map(async a => {
        try { const r = await api.get(`/api/assignments/${a.id}/my-submission`); subMap[a.id] = r.data; }
        catch { subMap[a.id] = null; }
      }));
      setSubmissions(subMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!submitFile) return setSubmitError('Please select a file');
    setSubmitting(true); setSubmitError('');
    try {
      const fileUrl = await uploadFile(submitFile, 'submissions');
      await api.post(`/api/assignments/${submitModal.id}/submit`, { file_url: fileUrl });
      setSubmitModal(null); setSubmitFile(null);
      setSubmitSuccess('Assignment submitted successfully!');
      fetchAll();
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (err) { setSubmitError(err.response?.data?.error || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#4f6ef7] border-t-transparent animate-spin" /></div>;

  const attCounts = attendance.reduce((a, r) => { a[r.status] = (a[r.status]||0)+1; return a; }, {});

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Navbar />
      <div className="page-container">
        <button onClick={() => navigate('/student')} className="btn-ghost mb-6 -ml-2 text-sm">← Back</button>

        {submitSuccess && <Alert type="success" message={submitSuccess} />}

        <div className="mb-6">
          <h1 className="page-title">Course Materials</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8eaf0] p-1 rounded-2xl mb-6 w-fit shadow-sm">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f1117]'
              }`}>{t}</button>
          ))}
        </div>

        {/* MATERIALS */}
        {tab === 'Materials' && (
          materials.length === 0
            ? <EmptyState icon="📂" title="No materials yet" subtitle="Your lecturer hasn't uploaded any materials for this course." />
            : <div className="space-y-3">
                {materials.map(m => (
                  <div key={m.id} className="card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#eef1fe] flex items-center justify-center text-lg shrink-0">📄</div>
                      <div>
                        <p className="font-semibold text-[#0f1117]">{m.title}</p>
                        <p className="text-xs text-[#9ca3af] mt-0.5">Week {m.week_number} · {new Date(m.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm shrink-0">Download</a>
                  </div>
                ))}
              </div>
        )}

        {/* ASSIGNMENTS */}
        {tab === 'Assignments' && (
          assignments.length === 0
            ? <EmptyState icon="📝" title="No assignments yet" subtitle="Assignments will appear here when your lecturer creates them." />
            : <div className="space-y-4">
                {assignments.map(a => {
                  const sub = submissions[a.id];
                  const isPast = new Date(a.due_date) < new Date();
                  return (
                    <div key={a.id} className="card">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-[#0f1117]">{a.title}</h3>
                            {sub ? <span className="badge-submitted">Submitted</span>
                              : isPast ? <span className="badge-red">Overdue</span>
                              : <span className="badge-amber">Pending</span>}
                          </div>
                          {a.instructions && <p className="text-sm text-[#6b7280]">{a.instructions}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-[#9ca3af]">
                            <span>📅 Due {new Date(a.due_date).toLocaleDateString()}</span>
                            <span>🎯 Max: {a.max_score} pts</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {sub ? (
                            <div className="text-right space-y-2">
                              <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">View file</a>
                              {sub.grade !== null && (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-right">
                                  <p className="text-sm font-bold text-green-700">{sub.grade}/{a.max_score} pts</p>
                                  {sub.feedback && <p className="text-xs text-[#6b7280] mt-1 italic">"{sub.feedback}"</p>}
                                </div>
                              )}
                            </div>
                          ) : !isPast ? (
                            <button className="btn-primary text-sm" onClick={() => setSubmitModal(a)}>Submit →</button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
        )}

        {/* ATTENDANCE */}
        {tab === 'Attendance' && (
          attendance.length === 0
            ? <EmptyState icon="📋" title="No attendance records" subtitle="Attendance records will appear here after sessions are recorded." />
            : <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[['Present',attCounts.present||0,'badge-green','✅'],
                    ['Absent',attCounts.absent||0,'badge-red','❌'],
                    ['Late',attCounts.late||0,'badge-amber','⏰']].map(([label,count,cls,icon]) => (
                    <div key={label} className="card text-center">
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-2xl font-bold text-[#0f1117]">{count}</div>
                      <div className="text-xs text-[#6b7280] font-medium mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="card overflow-hidden p-0">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {attendance.map(r => (
                        <tr key={r.id}>
                          <td>{new Date(r.session_date).toLocaleDateString()}</td>
                          <td><span className={`badge-${r.status}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
        )}
      </div>

      {submitModal && (
        <Modal title={`Submit: ${submitModal.title}`} onClose={() => { setSubmitModal(null); setSubmitFile(null); setSubmitError(''); }}>
          <p className="text-sm text-[#6b7280] mb-4">Upload your work as a PDF or DOCX file.</p>
          <Alert type="error" message={submitError} />
          <div className="mb-5">
            <label className="label">File (PDF or DOCX)</label>
            <input type="file" accept=".pdf,.docx" className="input" onChange={e => setSubmitFile(e.target.files[0])} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Uploading…' : 'Submit Assignment'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
