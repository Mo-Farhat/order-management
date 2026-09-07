export default function DeskLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy>
      <div className="flex items-end justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-40 rounded bg-surface" />
          <div className="h-3 w-56 rounded bg-surface" />
        </div>
        <div className="h-10 w-28 rounded-md bg-surface" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-card p-4">
            <div className="h-3 w-20 rounded bg-surface" />
            <div className="mt-3 h-6 w-16 rounded bg-surface" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-xl border border-line bg-card" />
    </div>
  );
}
