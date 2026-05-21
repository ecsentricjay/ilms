import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleConfig = {
  student:  { label: 'Student',       color: 'badge-blue',   dot: 'bg-blue-400' },
  lecturer: { label: 'Lecturer',      color: 'badge-purple', dot: 'bg-purple-400' },
  admin:    { label: 'Administrator', color: 'badge-amber',  dot: 'bg-amber-400' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const cfg = roleConfig[user?.role] || {};
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <header className="bg-white border-b border-[#e8eaf0] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl mesh-card flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base font-display">I</span>
          </div>
          <div>
            <span className="font-bold text-[#0f1117] text-lg leading-none font-display">ILMS</span>
            <span className="hidden sm:block text-[10px] text-[#9ca3af] leading-none mt-0.5">Learning Management System</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <span className="text-sm font-semibold text-[#0f1117]">{user.full_name}</span>
              <span className={`${cfg.color} text-[10px]`}>{cfg.label}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#eef1fe] flex items-center justify-center font-bold text-[#4f6ef7] text-sm">
              {initials}
            </div>
            <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
