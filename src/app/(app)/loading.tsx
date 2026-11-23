export default function LoadingPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted/70" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border bg-card p-4 space-y-2.5">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-6 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-xl border bg-card p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-12 w-full rounded-lg bg-muted/60" />
        <div className="h-12 w-full rounded-lg bg-muted/60" />
        <div className="h-12 w-full rounded-lg bg-muted/60" />
      </div>
    </div>
  );
}