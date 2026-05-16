export default function EventPageLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 px-4 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-64 bg-gray-700 rounded-lg animate-pulse mb-4" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-44 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">
        <section>
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
          </div>
        </section>

        <section>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-300 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-full bg-gray-200 animate-pulse" />
                    <div className="w-6 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="size-9 rounded-full bg-gray-200 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
