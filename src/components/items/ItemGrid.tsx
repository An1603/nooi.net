"use client";

import { BookOpen, Award, Gift } from "lucide-react";
import type { Item } from "@/lib/items";

interface Props {
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  items: Item[];
  children: React.ReactNode;
}

const TABS = [
  { key: null, label: "Tất cả", icon: null },
  { key: "hoc-tap", label: "Học tập", icon: BookOpen },
  { key: "ky-niem", label: "Kỷ niệm", icon: Award },
  { key: "qua-tang", label: "Quà tặng", icon: Gift },
];

export function ItemGrid({ activeCategory, onCategoryChange, items, children }: Props) {
  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key || "all"}
              onClick={() => onCategoryChange(tab.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="size-3.5" />}
              {tab.label}
              {tab.key !== null && (
                <span className={`text-[12px] ${isActive ? "opacity-70" : "text-muted-foreground/50"}`}>
                  {items.filter((i) => i.category === tab.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      {children}
    </div>
  );
}
