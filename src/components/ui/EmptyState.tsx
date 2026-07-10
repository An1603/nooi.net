import Link from "next/link";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children?: ReactNode;
}

export default function EmptyState({ icon = "📭", title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
        >
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
