import { CheckCircle2, Clock } from "lucide-react";

interface TimelineItem {
  date: string;
  title: string;
  desc: string;
  done: boolean;
}

interface ProjectTimelineProps {
  items: TimelineItem[];
}

export default function ProjectTimeline({ items }: ProjectTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Lộ trình dự án</h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                item.done
                  ? "bg-n-green/20 text-n-green"
                  : "bg-muted text-muted-foreground"
              }`}>
                {item.done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-n-gold font-medium">{item.date}</span>
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
