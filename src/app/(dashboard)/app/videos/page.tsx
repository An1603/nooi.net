export default function VideosPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Video</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Thư viện video đã render và xuất bản.
        </p>
      </div>

      <div className="p-12 rounded-xl border border-border bg-card text-center">
        <div className="text-4xl mb-4">🎬</div>
        <h3 className="text-lg font-semibold mb-2">Chưa có video nào</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload video đầu tiên hoặc tạo từ dự án để bắt đầu.
        </p>
      </div>
    </div>
  );
}
