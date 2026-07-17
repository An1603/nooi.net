"use client";

import { Lock, Download, Sparkles, Check } from "lucide-react";
import type { Item } from "@/lib/items";

interface Props {
  item: Item;
  owned: boolean;
  userN: number;
  userLevel: number;
  onUnlock: (itemId: string) => void;
  onDownload: (item: Item) => void;
  unlocking: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  "hoc-tap": "📚",
  "ky-niem": "🏆",
  "qua-tang": "🎁",
};

export function ItemCard({ item, owned, userN, userLevel, onUnlock, onDownload, unlocking }: Props) {
  const canAfford = userN >= item.price_n;
  const meetsLevel = userLevel >= item.level_required;
  const locked = !owned && !(item.price_n === 0 && meetsLevel);

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5">
      {/* Preview image */}
      <div className="aspect-square bg-gradient-to-br from-muted/50 to-card flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-5xl opacity-30">{CATEGORY_ICONS[item.category] || "📄"}</div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{item.name}</p>
            {item.description && (
              <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
            )}
          </div>
          {/* Price / Status badge */}
          <div className="shrink-0">
            {owned ? (
              <span className="inline-flex items-center gap-0.5 text-[12px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Check className="size-3" /> Đã mở
              </span>
            ) : item.price_n === 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[12px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="size-3" /> Free
              </span>
            ) : (
              <span className="text-xs font-bold text-primary font-mono">{item.price_n} N</span>
            )}
          </div>
        </div>

        {/* Action button */}
        {owned ? (
          <button
            onClick={() => onDownload(item)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Download className="size-3.5" /> Tải về
          </button>
        ) : item.price_n === 0 && meetsLevel ? (
          <button
            onClick={() => onUnlock(item.id)}
            disabled={unlocking}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {unlocking ? "Đang mở..." : "Nhận miễn phí"}
          </button>
        ) : (
          <button
            onClick={() => onUnlock(item.id)}
            disabled={!canAfford || unlocking || !meetsLevel}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock className="size-3" />
            {!meetsLevel
              ? `Cần Level ${item.level_required}`
              : !canAfford
              ? `Thiếu ${item.price_n - userN} N`
              : unlocking
              ? "Đang mở..."
              : `Mở khóa (${item.price_n} N)`}
          </button>
        )}
      </div>
    </div>
  );
}
