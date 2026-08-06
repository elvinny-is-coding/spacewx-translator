export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Status bar skeleton with branding */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-deep-indigo/50 border border-void-navy rounded-lg px-4 py-2 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-aurora-green to-aurora-violet" />
            <div className="h-6 w-20 rounded bg-void-navy" />
          </div>
          <div className="h-6 w-24 rounded bg-void-navy" />
        </div>

        {/* Header skeleton */}
        <div className="space-y-4 text-center">
          <div className="h-8 w-56 mx-auto rounded bg-deep-indigo" />
          <div className="h-4 w-full max-w-xl mx-auto rounded bg-deep-indigo" />
        </div>

        {/* Gauge skeleton */}
        <div className="flex justify-center">
          <div className="h-64 w-64 rounded-full bg-deep-indigo animate-pulse relative">
            <div className="absolute inset-0 rounded-full border-4 border-aurora-green/30 border-t-aurora-green animate-spin" />
          </div>
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-deep-indigo border border-void-navy p-4 text-center animate-pulse"
            >
              <div className="h-4 w-20 mx-auto rounded bg-void-navy mb-2" />
              <div className="h-8 w-12 mx-auto rounded bg-void-navy" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
