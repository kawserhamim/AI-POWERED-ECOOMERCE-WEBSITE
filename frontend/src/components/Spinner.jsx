// Simple loading spinner used while API calls are in flight.
export default function Spinner({ size = 'h-8 w-8' }) {
  return (
    <div className="flex justify-center items-center py-10">
      <div
        className={`${size} border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin`}
      />
    </div>
  );
}