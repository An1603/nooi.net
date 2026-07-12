"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Globe,
  Link,
  Image,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface Props {
  userId: string;
  profile: {
    full_name: string;
    public_slug: string | null;
    public_bio: string | null;
    public_headline: string | null;
    public_avatar_url: string | null;
    public_website: string | null;
    public_social_links: Record<string, string> | null;
    public_skills: string[] | null;
    public_is_visible: boolean | null;
    ref_code: string | null;
  } | null;
}

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/..." },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
  { key: "zalo", label: "Zalo", placeholder: "https://zalo.me/..." },
];

export function PublicProfileSettings({ userId, profile }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [slug, setSlug] = useState(profile?.public_slug ?? "");
  const [headline, setHeadline] = useState(profile?.public_headline ?? "");
  const [bio, setBio] = useState(profile?.public_bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.public_avatar_url ?? "");
  const [website, setWebsite] = useState(profile?.public_website ?? "");
  const [skills, setSkills] = useState(
    (profile?.public_skills ?? []).join(", ")
  );
  const [isVisible, setIsVisible] = useState(profile?.public_is_visible ?? true);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    profile?.public_social_links ?? {}
  );

  const publicUrl = profile?.public_slug
    ? `https://nooi.net/u/${profile.public_slug}`
    : null;

  const handleCopyPublicUrl = useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Đã sao chép link trang cá nhân!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  }, [publicUrl]);

  const handleSave = useCallback(async () => {
    setLoading(true);

    try {
      // Parse skills
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Build social links object
      const cleanSocial: Record<string, string> = {};
      for (const [key, url] of Object.entries(socialLinks)) {
        const trimmed = url.trim();
        if (trimmed) {
          cleanSocial[key] = trimmed.startsWith("http")
            ? trimmed
            : `https://${trimmed}`;
        }
      }

      const updates: Record<string, unknown> = {
        public_slug: slug.trim() || null,
        public_headline: headline.trim() || null,
        public_bio: bio.trim() || null,
        public_avatar_url: avatarUrl.trim() || null,
        public_website: website.trim() || null,
        public_skills: skillsArray,
        public_is_visible: isVisible,
        public_social_links: cleanSocial,
      };

      // Validate slug format
      const cleanSlug = slug.trim().toLowerCase();
      if (cleanSlug && !/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(cleanSlug)) {
        toast.error(
          "Slug không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch ngang (2-50 ký tự)."
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("✅ Đã cập nhật trang cá nhân!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  }, [
    slug,
    headline,
    bio,
    avatarUrl,
    website,
    skills,
    isVisible,
    socialLinks,
    supabase,
    userId,
  ]);

  const updateSocial = (key: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-xl border border-border bg-card mb-6">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Trang cá nhân công khai</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tùy chỉnh trang hồ sơ NOOI của bạn — mọi người có thể xem tại{" "}
          <code className="text-primary">nooi.net/u/...</code>
        </p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Public URL preview */}
        {publicUrl && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <span className="text-sm font-medium">Link trang cá nhân:</span>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  {publicUrl}
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <button
                onClick={handleCopyPublicUrl}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="pub-slug">
            Đường dẫn (slug) <span className="text-muted-foreground font-normal">— nooi.net/u/...</span>
          </Label>
          <div className="relative">
            <Link className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pub-slug"
              placeholder="ten-cua-ban"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              className="pl-8 font-mono text-sm"
              maxLength={50}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Chỉ chữ thường, số và dấu gạch ngang. Tự động tạo từ mã giới thiệu.
          </p>
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <Label htmlFor="pub-headline">Chức danh / Dòng giới thiệu</Label>
          <div className="relative">
            <Sparkles className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pub-headline"
              placeholder="VD: Chuyên gia chuyển hóa thân tâm"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="pl-8"
              maxLength={200}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label htmlFor="pub-bio">Giới thiệu bản thân</Label>
          <textarea
            id="pub-bio"
            placeholder="Viết vài dòng về bản thân, hành trình, chuyên môn..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            maxLength={1000}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {bio.length}/1000
          </p>
        </div>

        {/* Avatar URL */}
        <div className="space-y-1.5">
          <Label htmlFor="pub-avatar">Ảnh đại diện (URL)</Label>
          <div className="relative">
            <Image className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pub-avatar"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            URL ảnh từ Google Drive, Imgur, hoặc bất kỳ nguồn nào. Để trống để dùng chữ cái đầu.
          </p>
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <Label htmlFor="pub-website">Website cá nhân</Label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pub-website"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-1.5">
          <Label htmlFor="pub-skills">Kỹ năng / Chuyên môn</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pub-skills"
              placeholder="Thiền, Khí công, Coaching, Reiki, ..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Cách nhau bằng dấu phẩy. VD: Thiền, Khí công, Coaching
          </p>
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Mạng xã hội</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key} className="space-y-1">
                <Label
                  htmlFor={`social-${platform.key}`}
                  className="text-xs text-muted-foreground"
                >
                  {platform.label}
                </Label>
                <Input
                  id={`social-${platform.key}`}
                  placeholder={platform.placeholder}
                  value={socialLinks[platform.key] ?? ""}
                  onChange={(e) => updateSocial(platform.key, e.target.value)}
                  className="text-sm"
                  maxLength={500}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-3">
            {isVisible ? (
              <Eye className="size-5 text-emerald-400" />
            ) : (
              <EyeOff className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isVisible ? "Trang cá nhân đang công khai" : "Trang cá nhân đang ẩn"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isVisible
                  ? "Mọi người có thể xem trang cá nhân của bạn"
                  : "Chỉ bạn mới thấy trang cá nhân"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              isVisible ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isVisible ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="outline"
            className="text-sm"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Globe className="size-3.5" />
            )}
            {loading ? "Đang lưu..." : "💾 Lưu trang cá nhân"}
          </Button>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            >
              <ExternalLink className="size-3.5" />
              Xem thử
            </a>
          )}
        </div>
      </div>
    </div>
  );
}