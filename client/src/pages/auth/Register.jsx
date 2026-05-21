import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      login(data.token, data.user);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md fade-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl mesh-card flex items-center justify-center shadow-md">
            <span className="text-white font-bold font-display">I</span>
          </div>
          <span className="font-bold text-xl font-display text-[#0f1117]">ILMS</span>
        </div>

        <h2 className="text-3xl font-bold text-[#0f1117] font-display mb-1">Create account</h2>
        <p className="text-[#6b7280] mb-8">Join your institution's learning platform</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" className="input" placeholder="John Doe"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {[['student','🎓','Student'],['lecturer','🏫','Lecturer']].map(([val, icon, label]) => (
                  <button key={val} type="button"
                    onClick={() => setForm({ ...form, role: val })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === val
                        ? 'border-[#4f6ef7] bg-[#eef1fe]'
                        : 'border-[#e8eaf0] hover:border-[#4f6ef7]/40'
                    }`}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-sm font-semibold text-[#0f1117]">{label}</div>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[#6b7280]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4f6ef7] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
