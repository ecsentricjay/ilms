export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-[#0f1117] text-lg">{title}</h3>
      {subtitle && <p className="text-[#9ca3af] text-sm mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
