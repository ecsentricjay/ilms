export default function Alert({ type = 'error', message }) {
  if (!message) return null;
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  };
  const icons = { error: '⚠️', success: '✓', info: 'ℹ️' };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm flex items-start gap-2 mb-4 ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
