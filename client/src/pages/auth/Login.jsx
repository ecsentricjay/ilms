import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.token, data.user);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen auth-bg flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 mesh-card flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
            <span className="text-white font-bold text-2xl font-display">I</span>
          </div>
          <h1 className="text-4xl font-bold text-white font-display leading-tight">
            Integrated Learning<br />Management System
          </h1>
          <p className="text-white/70 mt-4 text-lg">Your academic journey, all in one place.</p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {[['📚','Course Management'],['📝','Assignments'],['📊','Analytics'],['🎓','Results']].map(([icon, label]) => (
            <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-white/90 text-sm font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl mesh-card flex items-center justify-center">
              <span className="text-white font-bold font-display">I</span>
            </div>
            <span className="font-bold text-xl font-display">ILMS</span>
          </div>

          <h2 className="text-3xl font-bold text-[#0f1117] font-display mb-1">Welcome back</h2>
          <p className="text-[#6b7280] mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#4f6ef7] font-semibold hover:underline">Create one</Link>
          </p>

          <div className="mt-12 pt-8 border-t border-[#e5e7eb] text-center">
            <p className="text-xs text-[#9ca3af]">
              Designed and developed by
            </p>
            <p className="text-sm font-semibold text-[#4f6ef7] mt-1">
              Abadi Success (u/2022/21878)
            </p>
            <p className="text-xs text-[#9ca3af] mt-1">
              for Department of Computer Science, IAUE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
