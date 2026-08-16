interface HighlightItem {
  icon: string;
  title: string;
  desc: string;
}

interface ProjectHighlightsProps {
  items: HighlightItem[];
}

export default function ProjectHighlights({ items }: ProjectHighlightsProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Điểm nổi bật</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
