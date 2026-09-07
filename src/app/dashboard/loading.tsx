export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 space-y-4 animate-pulse">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-stone-200/80" />
            <div className="space-y-1">
              <div className="w-24 h-4 rounded-md bg-stone-200/80" />
              <div className="w-16 h-3 rounded-md bg-stone-100" />
            </div>
          </div>
          <div className="w-20 h-6 rounded-full bg-stone-200/80" />
        </div>

        {/* Saldo Bersama Card Skeleton */}
        <div className="p-4 rounded-3xl bg-amber-50/60 border border-amber-100/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="w-28 h-3 rounded-md bg-amber-200/60" />
              <div className="w-44 h-8 rounded-lg bg-amber-200/70" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-200/50" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/40">
            <div className="h-12 rounded-xl bg-white/70" />
            <div className="h-12 rounded-xl bg-white/70" />
          </div>
        </div>

        {/* Quick Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-16 rounded-2xl bg-stone-100 border border-stone-200/60" />
          <div className="h-16 rounded-2xl bg-stone-100 border border-stone-200/60" />
        </div>

        {/* Recent Transactions List Skeleton */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="w-32 h-3 rounded-md bg-stone-200/80" />
            <div className="w-16 h-3 rounded-md bg-stone-200/80" />
          </div>

          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white border border-stone-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-100" />
                  <div className="space-y-1">
                    <div className="w-28 h-3.5 rounded-md bg-stone-200/80" />
                    <div className="w-16 h-2.5 rounded-md bg-stone-100" />
                  </div>
                </div>
                <div className="w-20 h-4 rounded-md bg-stone-200/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
