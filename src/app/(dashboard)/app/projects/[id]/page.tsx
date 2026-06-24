export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Project: {id}</h1>
      <p className="text-muted-foreground">Project details and editor will appear here.</p>
    </div>
  );
}
