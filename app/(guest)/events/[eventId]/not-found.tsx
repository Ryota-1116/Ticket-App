import Link from "next/link";

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">🎪</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        This event may have ended, been removed, or the link may be incorrect.
      </p>
    </div>
  );
}
