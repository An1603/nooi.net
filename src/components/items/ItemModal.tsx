"use client";

import { useState } from "react";
import { X, Download, Lock, Sparkles, Check, Gift, Send } from "lucide-react";
import type { Item } from "@/lib/items";
import { giftItem } from "@/lib/items";
import { toast } from "sonner";

interface Props {
  item: Item;
  owned: boolean;
  userN: number;
  userLevel: number;
  onUnlock: (itemId: string) => void;
  onDownload: (item: Item) => void;
  onClose: () => void;
  unlocking: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  "hoc-tap": "📚 Học tập",
  "ky-niem": "🏆 Kỷ niệm",
  "qua-tang": "🎁 Quà tặng",
};

export function ItemModal({ item, owned, userN, userLevel, onUnlock, onDownload, onClose, unlocking }: Props) {
  const canAfford = userN >= item.price_n;
  const meetsLevel = userLevel >= item.level_required;
  const [showGift, setShowGift] = useState(false);
  const [recipientCode, setRecipientCode] = useState("");
  const [sending, setSending] = useState(false);

  const handleGift = async () => {
    if (!recipientCode.trim()) return;
    setSending(true);
    const result = await giftItem(item.id, recipientCode.trim().toUpperCase());
    if (result.success) {
      toast.success(`🎁 Đã tặng ${item.name} cho ${result.recipientName || recipientCode.toUpperCase()}!`);
      setShowGift(false);
      setRecipientCode("");
    } else {
      toast.error(result.error || "Không thể tặng.");
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-card flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <div className="text-6xl opacity-30">📄</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="size-4" />
          </button>
          <div className="absolute top-3 left-3">
            {owned ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                <Check className="size-3.5" /> Đã sở hữu
              </span>
            ) : item.price_n === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                <Sparkles className="size-3.5" /> Miễn phí
              </span>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{CATEGORY_LABELS[item.category] || item.category}</span>
              {item.level_required > 0 && <span>· Cần Level {item.level_required}</span>}
            </div>
            <h2 className="text-lg font-bold">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="rounded-xl bg-muted/20 p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Giá</span>
            <span className="text-lg font-bold font-mono text-primary">
              {item.price_n === 0 ? "Miễn phí" : `${item.price_n} N`}
            </span>
          </div>

          {/* Actions */}
          {owned ? (
            <div className="space-y-2">
              <button
                onClick={() => onDownload(item)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all"
              >
                <Download className="size-4" /> Tải về
              </button>
              <button
                onClick={() => setShowGift(!showGift)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 text-primary font-medium hover:bg-primary/5 transition-all"
              >
                <Gift className="size-4" /> Tặng bạn
              </button>

              {/* Gift form */}
              {showGift && (
                <div className="rounded-xl bg-muted/20 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-muted-foreground">
                    Nhập mã giới thiệu của bạn NOOI để tặng vật phẩm này
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recipientCode}
                      onChange={(e) => setRecipientCode(e.target.value.toUpperCase())}
                      placeholder="VD: AN, NINH..."
                      className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:border-primary/50 text-uppercase"
                      maxLength={10}
                    />
                    <button
                      onClick={handleGift}
                      disabled={sending || !recipientCode.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {sending ? "..." : <Send className="size-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !meetsLevel ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-muted/30 text-muted-foreground font-medium cursor-not-allowed"
            >
              🔒 Cần Level {item.level_required} để mở khóa
            </button>
          ) : !canAfford ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-muted/30 text-muted-foreground font-medium cursor-not-allowed"
            >
              ⚡ Thiếu {item.price_n - userN} N
            </button>
          ) : (
            <button
              onClick={() => onUnlock(item.id)}
              disabled={unlocking}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all disabled:opacity-50"
            >
              {unlocking ? "Đang mở..." : item.price_n === 0 ? "🎁 Nhận miễn phí" : `🔓 Mở khóa (${item.price_n} N)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
