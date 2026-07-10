export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted/30 rounded-lg"/>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i=><div key={i} className="h-24 rounded-xl border border-border/50 bg-card/50"/>)}
      </div>
      <div className="h-64 rounded-xl border border-border/50 bg-card/50"/>
    </div>
  );
}
