"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, Share2 } from "lucide-react";

interface Props {
  refCode: string;
  fullName: string;
}

export function ShareButton({ refCode, fullName }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://nooi.net/signup?ref=${refCode}`;
  const shareText = `Cùng ${fullName} tham gia hành trình chuyển hóa thân tâm trên NOOI!`;

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `NOOI — ${fullName}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã sao chép link giới thiệu!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  }, [shareUrl, shareText, fullName]);

  return (
    <button
      onClick={handleShare}
      aria-label="Chia sẻ trang"
      className="fixed top-4 right-4 z-50 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-all shadow-lg"
    >
      {copied ? (
        <><Check className="size-4 text-emerald-400" /> Đã sao chép</>
      ) : (
        <><Share2 className="size-4" /> Chia sẻ</>
      )}
    </button>
  );
}