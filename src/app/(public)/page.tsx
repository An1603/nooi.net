'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import { TechBackground } from '@/components/effects/TechBackground';
import { AnimatedGradient } from '@/components/effects/AnimatedGradient';
import {
  Sparkles,
  Brain,
  Video,
  BookOpen,
  Network,
  ArrowUpRight,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  Bot,
  Layers,
  BarChart3,
  Hexagon,
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
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[150px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent/6 rounded-full blur-[130px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-n-purple/4 rounded-full blur-[180px] animate-pulse-glow" style={{ animationDelay: '4s' }} />
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-n-teal/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
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
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-20 overflow-hidden">
      <AnimatedGradient />
      <GradientOrbs />
      <FloatingHexagons />
      <TechBackground />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-8 animate-slide-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl animate-pulse-glow" />
            <LogoFull />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/8 text-primary text-xs mb-6 animate-slide-up opacity-0 backdrop-blur-sm"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <Sparkles size={14} />
          Nền tảng AI thế hệ mới
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 animate-slide-up opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          Kết nối{' '}
          <span className="text-gradient-ai">tri thức</span>
          <br />
          Chuyển mình{' '}
          <span className="text-gradient-ai">cùng AI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10 animate-slide-up opacity-0"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          nooi.net là nền tảng sản xuất nội dung AI toàn diện —
          xây dựng dự án, quản lý video, truy cập tài liệu học tập
          và cộng tác với các tác tử thông minh.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up opacity-0"
          style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-base overflow-hidden transition-all hover:brightness-110 hover:shadow-[0_0_40px_rgba(200,148,62,0.25)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 flex items-center gap-2">
              Bắt đầu miễn phí
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
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
            { label: 'Tác tử AI', value: '8+' },
            { label: 'Định dạng', value: '12+' },
            { label: 'Tích hợp', value: '20+' },
            { label: 'Uptime', value: '99.9%' },
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
   Features Section
   ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Bot,
    title: 'Tác tử AI thông minh',
    desc: 'Các tác tử AI học hỏi từ quy trình làm việc của bạn, tự động hoá tác vụ và đề xuất cải tiến.',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'hover:border-amber-500/20',
    accent: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  {
    icon: Video,
    title: 'Nền tảng Video',
    desc: 'Up, quản lý, streaming video chất lượng cao với encoding tự động và CDN.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'hover:border-emerald-500/20',
    accent: 'text-emerald-400',
    glow: 'rgba(74, 173, 106, 0.15)',
  },
  {
    icon: BookOpen,
    title: 'Trung tâm Học tập',
    desc: 'Khoá học, tài liệu, hướng dẫn tương tác — tất cả trong một hệ sinh thái thống nhất.',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'hover:border-blue-500/20',
    accent: 'text-blue-400',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  {
    icon: Network,
    title: 'Cộng tác thông minh',
    desc: 'Làm việc nhóm theo thời gian thực, chia sẻ dự án, và phối hợp với AI agent.',
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'hover:border-violet-500/20',
    accent: 'text-violet-400',
    glow: 'rgba(139, 92, 246, 0.15)',
  },
  {
    icon: Shield,
    title: 'Bảo mật đa lớp',
    desc: 'Mã hoá đầu cuối, RBAC, audit logs — kiểm soát toàn bộ dữ liệu của bạn.',
    color: 'from-rose-500/20 to-rose-500/5',
    border: 'hover:border-rose-500/20',
    accent: 'text-rose-400',
    glow: 'rgba(244, 63, 94, 0.15)',
  },
  {
    icon: Zap,
    title: 'Hiệu suất cao',
    desc: 'Edge-ready, CDN toàn cầu, và tối ưu hoá tự động cho tốc độ tối đa.',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5 text-primary text-xs mb-4 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <Sparkles size={12} />
            Tính năng nổi bật
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mọi thứ bạn cần trong{' '}
            <span className="text-gradient-fire">một nền tảng</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Từ ý tưởng đến sản phẩm — nooi.net cung cấp đầy đủ công cụ
            để bạn sáng tạo, quản lý và phát triển.
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
   Technology / Architecture Section
   ─────────────────────────────────────────────── */
const TECH_STACK = [
  { icon: Brain, label: 'Multi-Agent AI', desc: 'Hệ thống 8 profile tác tử chuyên biệt' },
  { icon: Layers, label: 'Microservices', desc: 'Kiến trúc phân tán, mở rộng linh hoạt' },
  { icon: Globe, label: 'Edge Network', desc: 'CDN toàn cầu, phản hồi mili-giây' },
  { icon: BarChart3, label: 'Analytics', desc: 'Theo dõi hiệu suất real-time' },
];

function TechSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="tech" className="relative py-24 px-5 overflow-hidden">
      <AnimatedGradient />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs mb-4 backdrop-blur-sm">
            <Zap size={12} />
            Công nghệ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vận hành bởi{' '}
            <span className="text-gradient-neon">AI tiên tiến</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Kiến trúc hiện đại, tối ưu cho mọi quy mô — từ cá nhân đến doanh nghiệp.
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
                <Brain size={32} className="text-primary-foreground" />
              </div>
              <div className="absolute inset-0 rounded-2xl animate-pulse-glow">
                <Hexagon size={80} className="text-primary/10" />
              </div>
            </div>
          </div>

          {/* Tech cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TECH_STACK.map((t, i) => {
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
        <div className={`relative p-8 md:p-12 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 animate-pulse-glow" style={{ padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

          {/* Decorative hexagons */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 0L93.3 25V75L50 100L6.7 75V25Z" fill="currentColor" className="text-primary" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-[0.03]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 0L93.3 25V75L50 100L6.7 75V25Z" fill="currentColor" className="text-accent" />
            </svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng{' '}
              <span className="text-gradient-gold">kết nối</span>{' '}
              và{' '}
              <span className="text-gradient-accent">chuyển mình</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Tham gia cùng hàng ngàn người dùng đang tận dụng sức mạnh AI
              để sáng tạo và phát triển.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10 flex items-center gap-2">
                  Tạo tài khoản miễn phí
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
              Nền tảng sản xuất nội dung AI — kết nối tri thức, chuyển mình cùng công nghệ.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold mb-3">Sản phẩm</p>
            <ul className="space-y-2">
              {['Tính năng', 'Bảng giá', 'Tích hợp', 'API'].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-sm font-semibold mb-3">Công ty</p>
            <ul className="space-y-2">
              {['Giới thiệu', 'Blog', 'Liên hệ', 'Tuyển dụng'].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
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
            &copy; {year} NOOI — Kết nối chuyển mình.
          </p>
          <div className="flex items-center gap-4">
            {['Twitter', 'GitHub', 'Discord'].map((s) => (
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
      <TechSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
