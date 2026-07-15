import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicProfileClient } from "./PublicProfileClient";
import { ShareButton } from "./ShareButton";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPublicProfile(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .rpc("get_public_profile", { slug })
    .maybeSingle();

  return data as {
    user_id: string;
    full_name: string;
    public_slug: string;
    public_bio: string;
    public_headline: string;
    public_avatar_url: string;
    public_website: string;
    public_social_links: Record<string, string>;
    public_skills: string[];
    public_is_visible: boolean;
    ref_code: string;
    created_at: string;
  } | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) {
    return { title: "Không tìm thấy — NOOI" };
  }

  const title = `${profile.full_name} — Hồ sơ NOOI`;
  const description = profile.public_headline
    ? `${profile.full_name} — ${profile.public_headline}`
    : `Hồ sơ thành viên NOOI: ${profile.full_name}`;

  const ogImageUrl = `https://nooi.net/api/og/profile/${profile.public_slug}`;

  return {
    title,
    description,
    openGraph: {
      title: `${profile.full_name} — NOOI Profile`,
      description,
      type: "profile",
      locale: "vi_VN",
      siteName: "NOOI",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.full_name} — NOOI Profile`,
        },
      ],
      username: profile.public_slug,
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.full_name} — NOOI Profile`,
      description,
      images: [ogImageUrl],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://nooi.net/u/${profile.public_slug}`,
    },
    other: {
      "fb:app_id": "", // Optional: Facebook App ID for better analytics
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) notFound();

  // Format created date
  const joined = new Date(profile.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Initials for avatar fallback
  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Social links
  const socialLinks = (profile.public_social_links || {}) as Record<string, string>;
  const socialIcons: Record<string, { label: string; icon: string }> = {
    facebook: { label: "Facebook", icon: "📘" },
    tiktok: { label: "TikTok", icon: "🎵" },
    youtube: { label: "YouTube", icon: "▶️" },
    instagram: { label: "Instagram", icon: "📸" },
    linkedin: { label: "LinkedIn", icon: "🔗" },
    x: { label: "X (Twitter)", icon: "🐦" },
    telegram: { label: "Telegram", icon: "✈️" },
    zalo: { label: "Zalo", icon: "💬" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Share Button */}
      <ShareButton refCode={profile.ref_code} fullName={profile.full_name} />

      {/* Top Logo */}
      <div className="relative z-10 flex justify-center pt-6 pb-2">
        <Link href="/" className="inline-flex items-center no-underline opacity-90 hover:opacity-100 transition-opacity">
          <Image
            src="/brand/nooi-horizontal.png"
            alt="NOOI"
            width={160}
            height={48}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="relative overflow-x-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/5 to-background pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="page-shell page-shell-wide px-4 sm:px-6 py-12 md:py-20">
          {/* ─── Hero Section ─── */}
          <div className="text-center mb-12">
            {/* Avatar */}
            <div className="mb-6">
              {profile.public_avatar_url ? (
                <img
                  src={profile.public_avatar_url}
                  alt={profile.full_name}
                  className="size-28 md:size-36 rounded-full mx-auto object-cover border-4 border-primary/20 shadow-xl shadow-primary/10"
                />
              ) : (
                <div className="size-28 md:size-36 rounded-full mx-auto bg-gradient-to-br from-primary/30 to-accent/30 border-4 border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
                  <span className="text-4xl md:text-5xl font-bold text-primary/70">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Name & Headline */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              {profile.full_name}
            </h1>
            {profile.public_headline && (
              <p className="text-lg md:text-xl text-primary font-medium mb-4">
                {profile.public_headline}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Thành viên NOOI từ {joined}
            </p>
          </div>

          {/* ─── Bio Section ─── */}
          {profile.public_bio && (
            <div className="max-w-2xl mx-auto mb-12">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Giới thiệu
                </h2>
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {profile.public_bio}
                </p>
              </div>
            </div>
          )}

          {/* ─── Skills Section ─── */}
          {profile.public_skills && profile.public_skills.length > 0 && (
            <div className="max-w-2xl mx-auto mb-12">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                Chuyên môn
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.public_skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-4 py-2 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ─── Social Links ─── */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="max-w-2xl mx-auto mb-12">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                Kết nối
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {Object.entries(socialLinks).map(([key, url]) => {
                  if (!url || typeof url !== "string") return null;
                  const info = socialIcons[key.toLowerCase()] || {
                    label: key,
                    icon: "🌐",
                  };
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                    >
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </a>
                  );
                })}
                {profile.public_website && (
                  <a
                    href={
                      profile.public_website.startsWith("http")
                        ? profile.public_website
                        : `https://${profile.public_website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                  >
                    <span>🌐</span>
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ─── CTA Section ─── */}
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 text-center">
              <h2 className="text-xl font-bold mb-2">
                Đồng hành cùng {profile.full_name}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Tham gia NOOI và bắt đầu hành trình chuyển hóa thân tâm của riêng bạn.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`/signup?ref=${profile.ref_code}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all text-sm shadow-lg shadow-primary/20"
                >
                  Tham gia NOOI
                </a>
                <PublicProfileClient refCode={profile.ref_code} fullName={profile.full_name} />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Mã giới thiệu: <code className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{profile.ref_code}</code>
                {" · "}Dùng để nhập khi đăng ký
              </p>
            </div>
          </div>
        </div>

        {/* ─── Footer Copyright ─── */}
        <footer className="relative z-10 mt-16 py-8 border-t border-border/30">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} NOOI Center — Kết nối chuyển mình.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Thân khỏe · Tâm minh · Hệ sinh thái giáo dục trải nghiệm & healing tourism
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}