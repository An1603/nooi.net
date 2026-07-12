"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

interface Props {
  refCode: string;
}

export function PublicProfileClient({ refCode }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const link = `https://nooi.net/signup?ref=${refCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Đã sao chép link giới thiệu!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  }, [refCode]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-medium hover:bg-accent/10 transition-all text-sm"
    >
      {copied ? (
        <><Check className="size-4 text-emerald-400" /> Đã sao chép</>
      ) : (
        <><Copy className="size-4" /> Sao chép link giới thiệu</>
      )}
    </button>
  );
}