export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Video: {id}</h1>
      <p className="text-muted-foreground">Video player and details will appear here.</p>
    </div>
  );
}
