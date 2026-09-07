export default function ValidationsLoading() {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 space-y-4 animate-pulse">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1">
            <div className="w-36 h-5 rounded-md bg-stone-200/80" />
            <div className="w-52 h-3 rounded-md bg-stone-100" />
          </div>
          <div className="w-10 h-10 rounded-2xl bg-stone-100" />
        </div>

        {/* Pending Items Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-3xl bg-white border border-stone-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100/60" />
                  <div className="space-y-1">
                    <div className="w-28 h-4 rounded-md bg-stone-200/80" />
                    <div className="w-20 h-3 rounded-md bg-stone-100" />
                  </div>
                </div>
                <div className="w-24 h-5 rounded-md bg-stone-200/80" />
              </div>

              <div className="flex gap-2 pt-1 border-t border-stone-100">
                <div className="flex-1 h-9 rounded-xl bg-stone-100" />
                <div className="flex-1 h-9 rounded-xl bg-[#FFA259]/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
