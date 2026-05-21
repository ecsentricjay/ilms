import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course_title: '', course_code: '', description: '', semester: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try { const res = await api.get('/api/courses'); setCourses(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setCreating(true);
    try {
      await api.post('/api/courses', form);
      setShowModal(false);
      setForm({ course_title: '', course_code: '', description: '', semester: '' });
      fetchCourses();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create course'); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#4f6ef7] border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Navbar />
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 fade-up">
          <div>
            <p className="text-[#6b7280] text-sm mb-1">Lecturer portal</p>
            <h1 className="page-title text-3xl">{user?.full_name}</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ New Course</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'📚', label:'Total Courses', value: courses.length, color:'blue' },
            { icon:'🎓', label:'Semester', value: [...new Set(courses.map(c=>c.semester))].length, color:'purple' },
            { icon:'📝', label:'Active Semester', value: courses.filter(c=>c.semester===courses[0]?.semester).length, color:'green' },
            { icon:'⭐', label:'Your Courses', value: courses.length, color:'amber' },
          ].map((s,i) => <div key={s.label} className={`fade-up-${i+1}`}><StatCard {...s} /></div>)}
        </div>

        {/* Course grid */}
        {courses.length === 0
          ? <EmptyState icon="📚" title="No courses yet" subtitle="Create your first course to get started." action={<button className="btn-primary" onClick={() => setShowModal(true)}>Create Course</button>} />
          : <>
              <h2 className="font-semibold text-[#0f1117] mb-4">Your Courses</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((c, i) => (
                  <div key={c.id} className={`card-hover border-t-4 border-t-purple-500 fade-up-${Math.min(i+1,4)}`} onClick={() => navigate(`/lecturer/course/${c.id}`)}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="badge-purple">{c.course_code}</span>
                      <span className="text-xs text-[#9ca3af]">{c.semester}</span>
                    </div>
                    <h3 className="font-semibold text-[#0f1117] text-base mt-2 leading-snug">{c.course_title}</h3>
                    {c.description && <p className="text-sm text-[#6b7280] mt-1.5 line-clamp-2">{c.description}</p>}
                    <div className="mt-4 pt-4 border-t border-[#f8f9fc] text-xs font-semibold text-purple-600 flex items-center gap-1">
                      Manage course <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
        }
      </div>

      {showModal && (
        <Modal title="Create New Course" onClose={() => setShowModal(false)}>
          <Alert type="error" message={error} />
          <form onSubmit={handleCreate} className="space-y-4">
            <div><label className="label">Course Title</label><input type="text" className="input" placeholder="Introduction to Computer Science" value={form.course_title} onChange={e => setForm({...form, course_title: e.target.value})} required /></div>
            <div><label className="label">Course Code</label><input type="text" className="input" placeholder="CSC 101" value={form.course_code} onChange={e => setForm({...form, course_code: e.target.value})} required /></div>
            <div><label className="label">Description (optional)</label><textarea className="input" rows={3} placeholder="Brief course description…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div><label className="label">Semester</label><input type="text" className="input" placeholder="2023/2024 First Semester" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} required /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create Course'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
