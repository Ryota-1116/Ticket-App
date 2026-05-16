export default function ConfirmationNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">🎫</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        Check your confirmation email for the correct link, or contact the event organizer.
      </p>
    </div>
  );
}
