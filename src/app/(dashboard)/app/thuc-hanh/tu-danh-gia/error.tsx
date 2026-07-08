"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
        <h2 className="text-lg font-bold text-red-400">Lỗi trang Tự Đánh Giá</h2>
        <p className="text-sm text-muted-foreground font-mono break-all">
          {error.message}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Digest: {error.digest}
          </p>
        )}
        <details className="text-xs text-muted-foreground/60">
          <summary>Stack trace</summary>
          <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
        </details>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
      >
        Thử lại
      </button>
    </div>
  );
}
