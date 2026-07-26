"use client";

import { useRef, useState, useEffect } from "react";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";

interface SlideViewerProps {
  slideUrl?: string;
  htmlContent?: string;
}

export default function HtmlSlideViewer({ slideUrl, htmlContent }: SlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const src = slideUrl || (htmlContent ? `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}` : "about:blank");

  return (
    <div 
      ref={containerRef} 
      className={`relative bg-card overflow-hidden mb-5 ${isFullscreen ? 'w-screen h-screen' : 'w-full aspect-video rounded-2xl border border-border/50'}`}
    >
      <iframe 
        src={src}
        className="absolute inset-0 w-full h-full border-0"
        title="Project Presentation"
        sandbox="allow-scripts allow-same-origin"
      />
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {slideUrl && (
          <a 
            href={slideUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-background/80 hover:bg-background text-foreground backdrop-blur-sm rounded-lg border border-border shadow-lg transition-all z-50 flex items-center justify-center"
            title="Mở tại slides.nooi.net"
          >
            <ExternalLink size={20} />
          </a>
        )}
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-background/80 hover:bg-background text-foreground backdrop-blur-sm rounded-lg border border-border shadow-lg transition-all z-50 flex items-center justify-center"
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
    </div>
  );
}
