import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('my');
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [enrolSuccess, setEnrolSuccess] = useState('');
  const [enrolError, setEnrolError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [enrolledRes, allRes, resultsRes] = await Promise.all([
        api.get('/api/courses/enrolled'),
        api.get('/api/courses/browse/all'),
        api.get('/api/results/student')
      ]);
      setCourses(enrolledRes.data);
      setAllCourses(allRes.data);
      setResults(resultsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSelfEnrol = async (courseId) => {
    setEnrolling(courseId); setEnrolError(''); setEnrolSuccess('');
    try {
      await api.post(`/api/courses/${courseId}/self-enrol`);
      setEnrolSuccess('Enrolled successfully!');
      fetchData();
      setTimeout(() => setEnrolSuccess(''), 3000);
    } catch (err) {
      setEnrolError(err.response?.data?.error || 'Enrolment failed');
    } finally { setEnrolling(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#4f6ef7] border-t-transparent animate-spin" /></div>;

  const gradeColor = (g) => ({ A: 'badge-green', B: 'badge-blue', C: 'badge-amber', D: 'badge-amber', F: 'badge-red' }[g] || 'badge-gray');

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Navbar />
      <div className="page-container">
        {/* Header */}
        <div className="mb-8 fade-up">
          <p className="text-[#6b7280] text-sm mb-1">Good day,</p>
          <h1 className="page-title text-3xl">{user?.full_name} 👋</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'📚', label:'Enrolled Courses', value: courses.length, color:'blue' },
            { icon:'🏆', label:'Published Results', value: results.length, color:'green' },
            { icon:'✅', label:'Passing Grades', value: results.filter(r=>['A','B','C'].includes(r.grade)).length, color:'purple' },
            { icon:'📋', label:'Available Courses', value: allCourses.filter(c=>!c.enrolled).length, color:'amber' },
          ].map((s,i) => (
            <div key={s.label} className={`fade-up-${i+1}`}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8eaf0] p-1 rounded-2xl mb-6 w-fit shadow-sm">
          {[['my','My Courses'],['browse','Browse & Enrol'],['results','My Results']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === id ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f1117]'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* MY COURSES */}
        {tab === 'my' && (
          <div>
            {courses.length === 0
              ? <EmptyState icon="📚" title="No courses yet" subtitle="Browse and enrol in courses from the Browse tab." action={<button className="btn-primary" onClick={() => setTab('browse')}>Browse Courses</button>} />
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((c, i) => (
                    <div key={c.id} className={`card-hover border-t-4 border-t-[#4f6ef7] fade-up-${Math.min(i+1,4)}`} onClick={() => navigate(`/student/course/${c.id}`)}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="badge-blue">{c.course_code}</span>
                        <span className="text-xs text-[#9ca3af]">{c.semester}</span>
                      </div>
                      <h3 className="font-semibold text-[#0f1117] text-base mt-2 leading-snug">{c.course_title}</h3>
                      {c.description && <p className="text-sm text-[#6b7280] mt-1.5 line-clamp-2">{c.description}</p>}
                      {c.users && <p className="text-xs text-[#9ca3af] mt-3 flex items-center gap-1"><span>👤</span>{c.users.full_name}</p>}
                      <div className="mt-4 pt-4 border-t border-[#f8f9fc] text-xs font-semibold text-[#4f6ef7] flex items-center gap-1">
                        Open course <span>→</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* BROWSE */}
        {tab === 'browse' && (
          <div>
            {enrolSuccess && <Alert type="success" message={enrolSuccess} />}
            {enrolError && <Alert type="error" message={enrolError} />}
            {allCourses.length === 0
              ? <EmptyState icon="🔍" title="No courses available" subtitle="No courses have been created yet." />
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allCourses.map((c, i) => (
                    <div key={c.id} className={`card fade-up-${Math.min(i+1,4)} ${c.enrolled ? 'opacity-70' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="badge-blue">{c.course_code}</span>
                        {c.enrolled && <span className="badge-green">Enrolled</span>}
                      </div>
                      <h3 className="font-semibold text-[#0f1117] text-base mt-2 leading-snug">{c.course_title}</h3>
                      {c.description && <p className="text-sm text-[#6b7280] mt-1.5 line-clamp-2">{c.description}</p>}
                      <p className="text-xs text-[#9ca3af] mt-2">{c.semester}</p>
                      {c.users && <p className="text-xs text-[#9ca3af] mt-1 flex items-center gap-1"><span>👤</span>{c.users.full_name}</p>}
                      <div className="mt-4 pt-4 border-t border-[#f8f9fc]">
                        {c.enrolled
                          ? <button className="btn-ghost text-sm w-full" onClick={() => navigate(`/student/course/${c.id}`)}>Go to course →</button>
                          : <button className="btn-primary w-full" onClick={() => handleSelfEnrol(c.id)} disabled={enrolling === c.id}>
                              {enrolling === c.id ? 'Enrolling…' : 'Enrol Now'}
                            </button>
                        }
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* RESULTS */}
        {tab === 'results' && (
          <div>
            {results.length === 0
              ? <EmptyState icon="🏆" title="No results yet" subtitle="Results will appear here once your lecturers publish them." />
              : <div className="card overflow-hidden p-0">
                  <table className="data-table">
                    <thead><tr>
                      <th>Course</th><th>Score</th><th>Grade</th><th>Published</th>
                    </tr></thead>
                    <tbody>
                      {results.map(r => (
                        <tr key={r.id}>
                          <td>
                            <p className="font-semibold text-[#0f1117]">{r.courses?.course_title}</p>
                            <p className="text-xs text-[#9ca3af]">{r.courses?.course_code}</p>
                          </td>
                          <td className="font-bold text-[#0f1117]">{r.total_score}</td>
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
    </div>
  );
}
