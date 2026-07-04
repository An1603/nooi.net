'use client';

import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogoFull } from '@/components/brand/Logo';
import { TechBackground } from '@/components/effects/TechBackground';
import {
  Sparkles,
  Brain,
  Video,
  BookOpen,
  Network,
  ArrowUpRight,
  ChevronRight,
  Heart,
  Users,
  Compass,
  MessageCircle,
  Sun,
  Star,
  Leaf,
  LayoutDashboard,
} from 'lucide-react';

/* ───────────────────────────────────────────────
   Scroll reveal hook
   ─────────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ───────────────────────────────────────────────
   Floating hexagons
   ─────────────────────────────────────────────── */
function FloatingHexagons() {
  const positions = [
    { t: '10%', l: '3%', s: 28, d: 0, o: 0.05 },
    { t: '25%', r: '6%', s: 36, d: 2, o: 0.07 },
    { t: '50%', l: '2%', s: 22, d: 5, o: 0.04 },
    { t: '65%', r: '4%', s: 30, d: 8, o: 0.06 },
    { t: '80%', l: '8%', s: 18, d: 3, o: 0.04 },
    { t: '15%', r: '20%', s: 14, d: 6, o: 0.05 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {positions.map((p, i) => (
        <svg
          key={i}
          className="absolute"
          style={{
            top: p.t, left: p.l, right: p.r,
            width: p.s, height: p.s,
            animation: `float ${8 + p.d}s ease-in-out infinite, hexagon-drift ${20 + p.d}s linear infinite`,
            animationDelay: `${p.d}s`,
            opacity: p.o,
          }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M50 0L93.3 25V75L50 100L6.7 75V25Z"
            stroke="currentColor"
            strokeWidth="1"
            className="text-primary"
          />
        </svg>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Animated gradient orbs
   ─────────────────────────────────────────────── */
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Rich vibrant mesh — serene vibes */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 0% 10%, rgba(220,38,127,0.6) 0%, transparent 50%),
            radial-gradient(ellipse 90% 70% at 100% 5%, rgba(251,146,60,0.55) 0%, transparent 50%),
            radial-gradient(ellipse 80% 90% at 90% 90%, rgba(37,99,235,0.5) 0%, transparent 50%),
            radial-gradient(ellipse 70% 80% at 10% 90%, rgba(124,58,237,0.55) 0%, transparent 50%),
            radial-gradient(ellipse 120% 60% at 50% 50%, rgba(244,114,182,0.3) 0%, transparent 55%),
            radial-gradient(ellipse 80% 100% at 20% 30%, rgba(34,211,238,0.25) 0%, transparent 55%),
            radial-gradient(ellipse 60% 70% at 80% 40%, rgba(251,146,60,0.35) 0%, transparent 45%),
            radial-gradient(ellipse 100% 80% at 50% 100%, rgba(236,72,153,0.2) 0%, transparent 50%)
          `,
        }}
      />
      {/* Floating orbs for depth */}
      <div className="absolute top-[10%] left-[2%] w-[26rem] h-[26rem] rounded-full bg-gradient-to-br from-fuchsia-500/30 to-pink-600/15 blur-[160px] animate-float" />
      <div className="absolute top-[1%] right-[5%] w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/20 blur-[180px] animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute bottom-[10%] right-[2%] w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-blue-600/25 to-cyan-500/15 blur-[190px] animate-float" style={{ animationDelay: '-6s' }} />
      <div className="absolute bottom-[5%] left-[8%] w-[22rem] h-[22rem] rounded-full bg-gradient-to-br from-violet-600/30 to-purple-700/20 blur-[150px] animate-float" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-[30%] left-[25%] w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-pink-500/20 to-rose-400/15 blur-[170px] animate-float" style={{ animationDelay: '-5s' }} />
      {/* Light streaks */}
      <div className="absolute top-[15%] right-[8%] w-48 h-1 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent blur-sm rotate-45 animate-float" style={{ animationDelay: '-1s' }} />
      <div className="absolute top-[25%] right-[15%] w-36 h-0.5 bg-gradient-to-r from-transparent via-pink-300/15 to-transparent blur-sm -rotate-12 animate-float" style={{ animationDelay: '-4s' }} />
    </div>
  );
}

/* ───────────────────────────────────────────────
   3D Tilt card wrapper
   ─────────────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-200 ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Section wrapper with reveal
   Hero Section
   ─────────────────────────────────────────────── */
function HeroSection() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-20 overflow-hidden">
      <GradientOrbs />
      <FloatingHexagons />
      <TechBackground />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-8 animate-slide-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-blue-500/15 blur-2xl animate-pulse-glow" />
            <NextImage
              src="/logo-icon-original.png"
              alt="NOOI"
              width={200}
              height={70}
              className="h-20 w-auto"
              priority
            />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 text-xs mb-6 animate-slide-up opacity-0 backdrop-blur-sm"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Sparkles size={14} />
          Hành trình an nhiên
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4 animate-slide-up opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          Kết nối{' '}
          <span className="text-gradient-aurora inline-block">chuyển mình</span>
        </h1>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6 animate-slide-up opacity-0"
          style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
          Thân khỏe —{' '}
          <span className="text-gradient-gold inline-block">Tâm mình</span>
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10 animate-slide-up opacity-0"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          Kho trí tuệ bằng multimedia với các mentor, chuyên gia thân tâm
          kèm cặp, đồng hành cùng bạn trên hành trình{' '}
          <strong className="text-foreground">an nhiên, tự tại</strong>.
        </p>

        {/* CTA — conditional based on auth */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up opacity-0"
          style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          {loggedIn ? (
            <Link
              href="/app"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-base overflow-hidden transition-all hover:brightness-110 hover:shadow-[0_0_40px_rgba(200,148,62,0.25)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center gap-2">
                <LayoutDashboard size={16} />
                Vào trang cá nhân
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ) : (
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-base overflow-hidden transition-all hover:brightness-110 hover:shadow-[0_0_40px_rgba(200,148,62,0.25)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center gap-2">
                Bắt đầu hành trình
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          )}
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-medium text-base hover:bg-glass hover:border-muted-foreground/30 transition-all"
          >
            Khám phá thêm
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full max-w-2xl animate-slide-up opacity-0"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          {[
            { label: 'Chuyên gia thân tâm', value: '20+' },
            { label: 'Nội dung multimedia', value: '500+' },
            { label: 'Giờ thực hành', value: '10,000+' },
            { label: 'Học viên đồng hành', value: '5,000+' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-gradient-gold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] text-muted-foreground/50">Cuộn xuống</span>
        <div className="w-5 h-8 rounded-full border border-border flex items-start justify-center p-1 animate-bounce">
          <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   Features Section — NOOI real offerings
   ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: BookOpen,
    title: 'Kho trí tuệ Multimedia',
    desc: 'Video, audio, tài liệu phong phú về thiền định, khí công, yoga, dinh dưỡng học và tâm lý học ứng dụng — tất cả trong một kho tri thức sống động.',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'hover:border-amber-500/20',
    accent: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  {
    icon: Heart,
    title: 'Chuyên gia kèm cặp',
    desc: 'Đội ngũ mentor, chuyên gia thân tâm giàu kinh nghiệm đồng hành 1-1, thiết kế lộ trình cá nhân hóa — hỗ trợ bạn từng bước chuyển hóa.',
    color: 'from-rose-500/20 to-rose-500/5',
    border: 'hover:border-rose-500/20',
    accent: 'text-rose-400',
    glow: 'rgba(244, 63, 94, 0.15)',
  },
  {
    icon: Sun,
    title: 'Chuyển hóa thân tâm',
    desc: 'Các chương trình bài bản về thiền định, khí công dưỡng sinh, dinh dưỡng học chức năng và tâm lý học tích hợp — khoa học kết hợp thực hành.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'hover:border-emerald-500/20',
    accent: 'text-emerald-400',
    glow: 'rgba(74, 173, 106, 0.15)',
  },
  {
    icon: MessageCircle,
    title: 'Trợ lý AI giọng nói',
    desc: 'Trò chuyện thời gian thực với AI bằng giọng nói tự nhiên — giải đáp thắc mắc, nhắc nhở thực hành, đồng hành 24/7 mọi lúc mọi nơi.',
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'hover:border-violet-500/20',
    accent: 'text-violet-400',
    glow: 'rgba(139, 92, 246, 0.15)',
  },
  {
    icon: Compass,
    title: 'Du lịch chữa lành',
    desc: 'Healing tourism — những hành trình kết hợp thiên nhiên, thực hành thân tâm và sự hướng dẫn của chuyên gia để tái tạo năng lượng sống.',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'hover:border-blue-500/20',
    accent: 'text-blue-400',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  {
    icon: Users,
    title: 'Cộng đồng an nhiên',
    desc: 'Kết nối với những người cùng chí hướng trên hành trình tự tại — chia sẻ, học hỏi và lan tỏa năng lượng tích cực mỗi ngày.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'hover:border-cyan-500/20',
    accent: 'text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.15)',
  },
];

function FeaturesSection() {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section id="features" className="relative py-24 px-5 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Section header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 text-xs mb-4 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Sparkles size={12} />
            NOOI là gì?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Hệ sinh thái{' '}
            <span className="text-gradient-gold">thân tâm</span>{' '}
            toàn diện
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Từ kho tri thức multimedia đến mentor kèm cặp, trợ lý AI và cộng đồng đồng hành —
            NOOI là người bạn trên hành trình an nhiên, tự tại của bạn.
          </p>
        </div>

        {/* Feature grid with tilt */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <TiltCard key={i}>
                <div
                  className={`group relative p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm transition-all duration-300 ${f.border}`}
                  style={{
                    transitionDelay: `${i * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.5s ease-out ${i * 80}ms`,
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: `0 0 40px ${f.glow}` }}
                  />
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 ${f.accent}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   How NOOI Works Section
   ─────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  { icon: Brain, label: 'AI đa tác tử', desc: '8 tác tử AI chuyên biệt hỗ trợ nghiên cứu, nội dung, chăm sóc — vận hành âm thầm phía sau' },
  { icon: Video, label: 'Kho multimedia', desc: 'Video bài giảng, audio thiền, tài liệu đọc — học mọi lúc, mọi nơi, trên mọi thiết bị' },
  { icon: MessageCircle, label: 'Kết nối chuyên gia', desc: 'Chat, video call, theo dõi tiến trình — mentor luôn bên bạn trên từng bước đường' },
  { icon: Star, label: 'Cá nhân hóa', desc: 'AI học hỏi từ bạn, gợi ý lộ trình phù hợp với thể trạng, tâm trạng và mục tiêu' },
];

function HowSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how" className="relative py-24 px-5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-4 backdrop-blur-sm">
            <Leaf size={12} />
            Cách vận hành
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Công nghệ &{' '}
            <span className="text-gradient-ocean">con người</span>{' '}
            đồng hành
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            NOOI kết hợp sức mạnh AI tiên tiến với sự tận tâm của đội ngũ chuyên gia —
            tạo nên một hệ sinh thái học tập và chuyển hóa toàn diện.
          </p>
        </div>

        {/* Central node with orbiting cards */}
        <div className="relative mb-16">
          {/* Central node */}
          <div className="flex items-center justify-center mb-10">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full border border-primary/10 animate-pulse-glow" style={{ animationDelay: '0s' }} />
              <div className="absolute -inset-10 rounded-full border border-accent/5 animate-pulse-glow" style={{ animationDelay: '1s' }} />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/20 relative z-10">
                <Sun size={32} className="text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* How-it-works cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((t, i) => {
              const Icon = t.icon;
              return (
                <TiltCard key={i}>
                  <div
                    className="relative flex flex-col items-center text-center p-5 rounded-xl glass glass-hover transition-all"
                    style={{
                      transitionDelay: `${i * 100}ms`,
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0)' : 'translateY(20px)',
                      transition: `all 0.5s ease-out ${i * 150}ms`,
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                      i === 0 ? 'from-amber-500/20 to-amber-500/5 text-amber-400' :
                      i === 1 ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-400' :
                      i === 2 ? 'from-blue-500/20 to-blue-500/5 text-blue-400' :
                      'from-violet-500/20 to-violet-500/5 text-violet-400'
                    } flex items-center justify-center mb-3`}>
                      <Icon size={18} />
                    </div>
                    <h4 className="text-sm font-semibold mb-1">{t.label}</h4>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>

        {/* Divider hexagon row */}
        <div className="flex justify-center gap-3 opacity-20">
          {[...Array(7)].map((_, i) => (
            <svg
              key={i}
              className="w-4 h-4"
              viewBox="0 0 100 100"
              fill="none"
            >
              <path
                d="M50 5L90 30V70L50 95L10 70V30Z"
                stroke="currentColor"
                strokeWidth="2"
                className={i % 2 === 0 ? 'text-primary' : 'text-accent'}
              />
            </svg>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   CTA Section
   ─────────────────────────────────────────────── */
function CTASection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="about" className="relative py-24 px-5">
      <div className="max-w-4xl mx-auto text-center" ref={ref}>
        <div className={`relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-emerald-950/50 via-teal-950/40 to-cyan-950/50 border border-emerald-500/15 overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 animate-pulse-glow" style={{ padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

          {/* Decorative hexagons */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 0L93.3 25V75L50 100L6.7 75V25Z" fill="currentColor" className="text-emerald-400" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-[0.04]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 0L93.3 25V75L50 100L6.7 75V25Z" fill="currentColor" className="text-teal-400" />
            </svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Bắt đầu hành trình{' '}
              <span className="text-gradient-gold">an nhiên</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Tham gia cùng hàng ngàn người đang chuyển mình mỗi ngày —
              thân khỏe, tâm mình, sống an nhiên tự tại.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10 flex items-center gap-2">
                  Tham gia miễn phí
                  <ArrowUpRight size={16} />
                </span>
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-glass transition-all"
              >
                Liên hệ tư vấn
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   Footer
   ─────────────────────────────────────────────── */
function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t border-border py-12 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold mb-3">NOOI</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Kết nối chuyển mình — thân khỏe, tâm mình.
              Hệ sinh thái giáo dục trải nghiệm, chuyển hóa thân tâm
              và healing-tourism, nơi AI và chuyên gia đồng hành cùng bạn.
            </p>
          </div>

          {/* Khám phá */}
          <div>
            <p className="text-sm font-semibold mb-3">Khám phá</p>
            <ul className="space-y-2">
              {['Kho tri thức', 'Chuyên gia', 'Chương trình', 'Cộng đồng'].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <p className="text-sm font-semibold mb-3">Hỗ trợ</p>
            <ul className="space-y-2">
              {['Trợ giúp', 'Liên hệ', 'Câu hỏi thường gặp', 'Hướng dẫn'].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pháp lý */}
          <div>
            <p className="text-sm font-semibold mb-3">Pháp lý</p>
            <ul className="space-y-2">
              {['Bảo mật', 'Điều khoản', 'Cookie', 'GDPR'].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {year} NOOI — Kết nối chuyển mình, thân khỏe — tâm mình.
          </p>
          <div className="flex items-center gap-4">
            {['YouTube', 'TikTok', 'Facebook'].map((s) => (
              <Link
                key={s}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────────────────────────────
   Page assembly
   ─────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FeaturesSection />
      <HowSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
