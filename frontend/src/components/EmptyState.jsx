export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="text-center py-12">
      <p className="text-lg font-semibold text-gray-700">{title}</p>
      {message && <p className="text-gray-500 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}