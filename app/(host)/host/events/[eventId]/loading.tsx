export default function EventLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="h-7 w-56 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
