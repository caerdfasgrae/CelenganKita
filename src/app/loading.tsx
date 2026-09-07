export default function RootLoading() {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 space-y-4 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-stone-200/80" />
            <div className="w-28 h-4 rounded-md bg-stone-200/80" />
          </div>
          <div className="w-16 h-6 rounded-full bg-stone-200/80" />
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-100 space-y-3">
          <div className="w-32 h-3.5 rounded-md bg-stone-200/80" />
          <div className="w-48 h-8 rounded-lg bg-stone-200/70" />
          <div className="h-16 rounded-2xl bg-stone-50" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-white border border-stone-100 flex items-center justify-between"
            >
              <div className="w-32 h-3.5 rounded-md bg-stone-200/80" />
              <div className="w-20 h-4 rounded-md bg-stone-200/80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
