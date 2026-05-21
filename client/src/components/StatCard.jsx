export default function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-[#eef1fe] text-[#4f6ef7]',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-500',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-[#0f1117]">{value ?? '—'}</p>
        <p className="text-sm font-medium text-[#0f1117] mt-0.5">{label}</p>
        {sub && <p className="text-xs text-[#9ca3af] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
