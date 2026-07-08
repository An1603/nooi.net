"use client";

import { useState, useCallback, useEffect } from "react";
import { Maximize2, X } from "lucide-react";

interface FullscreenImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function FullscreenImage({ src, alt, caption, className = "" }: FullscreenImageProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const open = useCallback(() => setFullscreen(true), []);
  const close = useCallback(() => setFullscreen(false), []);

  // ESC to close
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, close]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  return (
    <>
      {/* Inline image */}
      <div className={`relative group rounded-lg overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-lg object-contain"
          style={{ maxHeight: "70vh" }}
        />
        {/* Fullscreen button overlay */}
        <button
          onClick={open}
          className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          title="Xem toàn màn hình"
        >
          <Maximize2 size={18} />
        </button>
        {caption && (
          <p className="text-xs text-muted-foreground mt-2 text-center">{caption}</p>
        )}
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={close}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            title="Đóng"
          >
            <X size={24} />
          </button>

          {/* Image */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          {caption && (
            <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/70">
              {caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}