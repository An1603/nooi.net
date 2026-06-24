export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dự án</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý tất cả dự án sản xuất nội dung của bạn.
        </p>
      </div>

      <div className="p-12 rounded-xl border border-border bg-card text-center">
        <div className="text-4xl mb-4">📁</div>
        <h3 className="text-lg font-semibold mb-2">Chưa có dự án nào</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tạo dự án đầu tiên để bắt đầu hành trình sản xuất nội dung với AI.
        </p>
      </div>
    </div>
  );
}
