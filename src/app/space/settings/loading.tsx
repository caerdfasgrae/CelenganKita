export default function SettingsLoading() {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 space-y-4 animate-pulse">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="space-y-1 pt-1">
          <div className="w-32 h-5 rounded-md bg-stone-200/80" />
          <div className="w-48 h-3 rounded-md bg-stone-100" />
        </div>

        {/* Space Info Card Skeleton */}
        <div className="p-4 rounded-3xl bg-white border border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-24 h-3 rounded-md bg-stone-100" />
              <div className="w-40 h-6 rounded-md bg-stone-200/80" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100/60" />
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 space-y-2">
            <div className="w-32 h-3 rounded-md bg-stone-100" />
            <div className="h-10 rounded-xl bg-white border border-stone-200/60" />
          </div>
        </div>

        {/* Members List Card Skeleton */}
        <div className="p-4 rounded-3xl bg-white border border-stone-100 space-y-3">
          <div className="w-28 h-4 rounded-md bg-stone-200/80" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-stone-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-stone-200/70" />
                  <div className="space-y-1">
                    <div className="w-24 h-3.5 rounded-md bg-stone-200/80" />
                    <div className="w-16 h-2.5 rounded-md bg-stone-100" />
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full bg-stone-200/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
