export default function LibraryPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Thư viện</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tài liệu, assets và học liệu của bạn.
        </p>
      </div>

      <div className="p-12 rounded-xl border border-border bg-card text-center">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-semibold mb-2">Thư viện trống</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tài liệu và assets sẽ xuất hiện ở đây sau khi bạn tạo hoặc upload.
        </p>
      </div>
    </div>
  );
}
