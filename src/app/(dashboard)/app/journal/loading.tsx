export default function Loading() {
  return <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse"><div className="h-8 w-48 bg-muted/30 rounded-lg"/><div className="space-y-4">{[1,2,3].map(i=><div key={i} className="h-32 rounded-xl border border-border/50 bg-card/50"/>)}</div></div>;
}
