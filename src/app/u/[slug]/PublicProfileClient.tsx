"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Copy, Check, Share2 } from "lucide-react";

interface Props {
  refCode: string;
  fullName: string;
}

export function PublicProfileClient({ refCode, fullName }: Props) {
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://nooi.net/u/${refCode.toLowerCase()}`;
  const shareUrl = `https://nooi.net/signup?ref=${refCode}`;
  const shareText = `Cùng ${fullName} tham gia hành trình chuyển hóa thân tâm trên NOOI!`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã sao chép link giới thiệu!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  }, [shareUrl]);

  const handleShare = useCallback(async () => {
    // Native share sheet on mobile (iOS/Android)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `NOOI — ${fullName}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall back to copy
      }
    }
    // Desktop / no native share → copy link
    handleCopy();
  }, [shareUrl, shareText, fullName, handleCopy]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all text-sm shadow-lg shadow-primary/20"
      >
        <Share2 className="size-4" />
        Chia sẻ trang
      </button>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-medium hover:bg-accent/10 transition-all text-sm"
      >
        {copied ? (
          <><Check className="size-4 text-emerald-400" /> Đã sao chép</>
        ) : (
          <><Copy className="size-4" /> Sao chép link</>
        )}
      </button>
    </div>
  );
}