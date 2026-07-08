"use client";
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-bold text-red-400">Lỗi Admin</h2>
        <p className="text-sm text-muted-foreground font-mono break-all mt-2">{error.message}</p>
      </div>
      <button onClick={reset} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Thử lại</button>
    </div>
  );
}
