export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted/30 rounded-lg" />
        <div className="h-4 w-64 bg-muted/20 rounded-lg" />
      </div>

      {/* AI Mentor skeleton */}
      <div className="h-32 rounded-xl border border-border/50 bg-card/50 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-muted/30" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-36 bg-muted/30 rounded-lg" />
            <div className="h-4 w-full bg-muted/20 rounded-lg" />
            <div className="h-4 w-3/4 bg-muted/20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="h-5 w-20 bg-muted/30 rounded-lg mb-2" />
            <div className="h-3 w-32 bg-muted/20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="h-6 w-12 bg-muted/30 rounded-lg mb-2" />
            <div className="h-3 w-16 bg-muted/20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
