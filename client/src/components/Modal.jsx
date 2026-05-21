import { useEffect } from 'react';

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-[#0f1117]/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} z-10 fade-up`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8eaf0]">
            <h3 className="font-semibold text-[#0f1117] text-lg font-display">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:bg-[#f8f9fc] hover:text-[#0f1117] transition-colors text-xl leading-none">×</button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
