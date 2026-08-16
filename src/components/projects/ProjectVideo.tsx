import { Video } from "lucide-react";

interface ProjectVideoProps {
  url: string;
  poster?: string;
}

export default function ProjectVideo({ url, poster }: ProjectVideoProps) {
  if (!url) return null;

  // Check if it's a YouTube URL and convert to embed
  let embedUrl = url;
  if (url.includes("youtube.com/watch")) {
    const videoId = new URL(url).searchParams.get("v");
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Video size={16} className="text-n-purple" />
        <h2 className="text-lg font-semibold text-foreground">Video giới thiệu</h2>
      </div>
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title="Video giới thiệu dự án"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
