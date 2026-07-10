export default function Loading() {
  return <div className="max-w-5xl mx-auto p-6 space-y-6 animate-pulse"><div className="h-8 w-48 bg-muted/30 rounded-lg"/><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-40 rounded-xl border border-border/50 bg-card/50"/>)}</div><div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 rounded-xl border border-border/50 bg-card/50"/>)}</div></div>;
}
