export default function Loading() {
  return <div className="max-w-5xl mx-auto p-6 space-y-6 animate-pulse"><div className="h-8 w-48 bg-muted/30 rounded-lg"/><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map(i=><div key={i} className="h-48 rounded-xl border border-border/50 bg-card/50"/>)}</div></div>;
}
