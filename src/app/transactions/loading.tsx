export default function TransactionsLoading() {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 space-y-4 animate-pulse">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1">
            <div className="w-32 h-5 rounded-md bg-stone-200/80" />
            <div className="w-48 h-3 rounded-md bg-stone-100" />
          </div>
          <div className="w-16 h-8 rounded-xl bg-stone-200/80" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex gap-2 overflow-hidden py-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-8 rounded-xl bg-stone-100 shrink-0" />
          ))}
        </div>

        {/* Transactions Items Skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-white border border-stone-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-100" />
                <div className="space-y-1">
                  <div className="w-32 h-3.5 rounded-md bg-stone-200/80" />
                  <div className="w-20 h-2.5 rounded-md bg-stone-100" />
                </div>
              </div>
              <div className="w-20 h-4 rounded-md bg-stone-200/80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
