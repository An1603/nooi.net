"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { MultiRadarChart } from "./MultiRadarChart";
import { AXES as G2_AXES } from "../tinh-huong/scenarios-data";

const G1_AXES = [
  { key: "thay", label: "THẤY", desc: "Quan sát bản thân", icon: "👁️" },
  { key: "hieu", label: "HIỂU", desc: "Thấu triệt nhân quả", icon: "🔍" },
  { key: "buong", label: "BUÔNG", desc: "Xả bỏ chấp trước", icon: "🍂" },
  { key: "antru", label: "AN TRÚ", desc: "Bình an nội tại", icon: "🏠" },
  { key: "bieton", label: "BIẾT ƠN", desc: "Lòng tri ân", icon: "🙏" },
  { key: "phungsu", label: "PHỤNG SỰ", desc: "Cho đi vô điều kiện", icon: "🤲" },
  { key: "tinhthuc", label: "TỈNH THỨC", desc: "Chánh niệm thường trực", icon: "🧘" },
];

const AXIS_KEYS = ["thay", "hieu", "buong", "antru", "bieton", "phungsu", "tinhthuc"];
const AXIS_LABELS = ["THẤY", "HIỂU", "BUÔNG", "AN TRÚ", "BIẾT ƠN", "PHỤNG SỰ", "TỈNH THỨC"];

// Số mệnh mặc định (khi chưa có Tử Vi/Thần Số)
const DEFAULT_DESTINY: Record<string, number> = {
  thay: 5, hieu: 5, buong: 5, antru: 5, bieton: 5, phungsu: 5, tinhthuc: 5,
};

interface AssessmentData {
  scores: Record<string, number> | null;
  raw_answers: Record<string, unknown> | null;
}

export default function NhanAnhPage() {
  const [loading, setLoading] = useState(true);
  const [g1Data, setG1Data] = useState<AssessmentData>({ scores: null, raw_answers: null });
  const [g2Data, setG2Data] = useState<AssessmentData>({ scores: null, raw_answers: null });
  const [destinyScores, setDestinyScores] = useState<Record<string, number>>(DEFAULT_DESTINY);
  const [hasTuVi, setHasTuVi] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch G1 (Tự Đánh Giá)
      const { data: g1 } = await supabase.from("self_assessments")
        .select("scores, raw_answers")
        .eq("user_id", user.id).eq("assessment_type", "self_7axes").maybeSingle();

      // Fetch G2 (Tình Huống)
      const { data: g2 } = await supabase.from("self_assessments")
        .select("scores, raw_answers")
        .eq("user_id", user.id).eq("assessment_type", "scenarios_21").maybeSingle();

      // Fetch Số Mệnh (Tử Vi)
      const { data: profile } = await supabase.from("profiles")
        .select("tuvi_report")
        .eq("user_id", user.id).maybeSingle();

      if (g1) setG1Data(g1);
      if (g2) setG2Data(g2);

      if (profile?.tuvi_report) {
        try {
          const tuvi = typeof profile.tuvi_report === "string" 
            ? JSON.parse(profile.tuvi_report) 
            : profile.tuvi_report;
          // Map Tử Vi cung sang 7 trục (simplified)
          const mapped: Record<string, number> = { ...DEFAULT_DESTINY };
          if (tuvi.cuc) mapped.thay = Math.min(10, Math.max(1, tuvi.cuc === "Mộc" ? 7 : tuvi.cuc === "Thủy" ? 8 : 5));
          setDestinyScores(mapped);
          setHasTuVi(true);
        } catch {}
      }

      setLoading(false);
    })();
  }, [supabase]);

  // ─── Tính toán ───
  const selfScores = g1Data.scores || {};
  const scenarioScores = g2Data.scores || {};

  const hasG1 = Object.keys(selfScores).length > 0;
  const hasG2 = Object.keys(scenarioScores).length > 0;

  // SAI = 100 - (∑|Số Mệnh - Tự Đánh Giá| / 70 × 100)
  const saiGap = AXIS_KEYS.reduce((sum, key) => {
    const destiny = destinyScores[key] || 5;
    const self = selfScores[key] || 5;
    return sum + Math.abs(destiny - self);
  }, 0);
  const SAI = hasG1 ? Math.max(0, Math.round(100 - (saiGap / 70) * 100)) : null;

  // SRI = 100 - (∑|Tình Huống - Tự Đánh Giá| / 70 × 100)
  const sriGap = AXIS_KEYS.reduce((sum, key) => {
    const scenario = scenarioScores[key] || 5;
    const self = selfScores[key] || 5;
    return sum + Math.abs(scenario - self);
  }, 0);
  const SRI = hasG1 && hasG2 ? Math.max(0, Math.round(100 - (sriGap / 70) * 100)) : null;

  // SMI = 100 - (∑|Số Mệnh - Tình Huống| / 70 × 100)
  const smiGap = AXIS_KEYS.reduce((sum, key) => {
    const destiny = destinyScores[key] || 5;
    const scenario = scenarioScores[key] || 5;
    return sum + Math.abs(destiny - scenario);
  }, 0);
  const SMI = hasG2 ? Math.max(0, Math.round(100 - (smiGap / 70) * 100)) : null;

  // Gap analysis
  const gaps = AXIS_KEYS.map(key => ({
    axis: key,
    label: AXIS_LABELS[AXIS_KEYS.indexOf(key)],
    destiny: destinyScores[key] || 5,
    self: selfScores[key] || null,
    scenario: scenarioScores[key] || null,
    selfVsScenario: hasG1 && hasG2 ? (selfScores[key] || 5) - (scenarioScores[key] || 5) : null,
    blindSpot: hasG1 && hasG2 && (selfScores[key] || 5) > (scenarioScores[key] || 5) + 1,
    potential: hasG1 && hasG2 && (scenarioScores[key] || 5) > (selfScores[key] || 5) + 1,
  }));

  function levelLabel(val: number | null): string {
    if (val === null) return "—";
    if (val >= 80) return "Minh triết / Thực chứng / Làm chủ";
    if (val >= 60) return "Tỉnh thức / Vững vàng / Tiến bộ";
    if (val >= 40) return "Đang học / Dao động / Trung bình";
    if (val >= 20) return "Vô minh / Mâu thuẫn / Yếu";
    return "Ảo tưởng nặng / Mất kiểm soát";
  }

  // ─── RENDER ───
  if (loading) return <div className="max-w-3xl mx-auto p-6 flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!hasG1 && !hasG2) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center"><span className="text-3xl">🧬</span></div>
        <h1 className="text-2xl font-bold">NHÂN ẢNH</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Để có NHÂN ẢNH hoàn chỉnh, bạn cần hoàn thành ít nhất một trong hai bài đánh giá:
        </p>
        <div className="space-y-3">
          <a href="/app/thuc-hanh/tu-danh-gia" className="block w-full py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/20 transition-all">
            🪞 Bắt đầu với Tấm Gương Tự Biết Mình
          </a>
          <a href="/app/thuc-hanh/tinh-huong" className="block w-full py-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-all">
            🎬 Bắt đầu với Tình Huống Thực Tế
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center"><span className="text-3xl">🧬</span></div>
        <h1 className="text-2xl font-bold">NHÂN ẢNH</h1>
        <p className="text-muted-foreground text-sm">Chân dung tổng hợp từ 3 lớp: Số Mệnh · Tình Huống · Tự Đánh Giá</p>
      </div>

      {/* Radar Chart 3 đường */}
      {hasG1 && (
        <div className="rounded-xl border border-border bg-card p-4 flex justify-center">
          <MultiRadarChart
            labels={AXIS_LABELS}
            datasets={[
              { label: "Số Mệnh", scores: destinyScores, color: "#a78bfa" },
              { label: "Tình Huống", scores: scenarioScores, color: "#22d3ee" },
              { label: "Tự Đánh Giá", scores: selfScores, color: "#fbbf24" },
            ]}
          />
        </div>
      )}

      {/* Chỉ số */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "SAI", value: SAI, desc: "Tự Biết Mình", detail: "Khoảng cách giữa điều bạn nghĩ về mình và số mệnh" },
          { label: "SRI", value: SRI, desc: "Thực Chứng", detail: "Khoảng cách giữa lời nói và hành động thực tế" },
          { label: "SMI", value: SMI, desc: "Làm Chủ", detail: "Mức độ vượt qua số mệnh bẩm sinh" },
        ].map(({ label, value, desc, detail }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">{desc}</p>
            <p className={`text-2xl font-bold ${value === null ? "text-muted-foreground/30" : value >= 60 ? "text-green-400" : value >= 40 ? "text-yellow-400" : "text-red-400"}`}>
              {value ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{detail}</p>
            <p className="text-[10px] text-muted-foreground/60">{levelLabel(value)}</p>
          </div>
        ))}
      </div>

      {/* Gap Analysis */}
      {hasG1 && hasG2 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">🔍 Phân Tích Khoảng Cách</h3>
          <div className="space-y-2">
            {gaps.filter(g => g.blindSpot || g.potential).map(g => (
              <div key={g.axis} className={`rounded-lg p-3 text-sm ${g.blindSpot ? "bg-red-500/5 border border-red-500/20" : "bg-green-500/5 border border-green-500/20"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{g.label}</span>
                  <span className={`text-xs font-medium ${g.blindSpot ? "text-red-400" : "text-green-400"}`}>
                    {g.blindSpot ? "🔴 Điểm mù" : "🟢 Tiềm năng"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {g.blindSpot
                    ? `Bạn tự đánh giá mình cao hơn (${g.self}/10) so với thực tế (${g.scenario}/10). Đây là khoảng cách giữa điều bạn NGHĨ và điều bạn LÀM.`
                    : `Bạn làm tốt hơn (${g.scenario}/10) so với điều bạn nghĩ về mình (${g.self}/10). Hãy tự tin hơn vào khả năng thực sự của bạn.`
                  }
                </p>
              </div>
            ))}
            {gaps.filter(g => g.blindSpot || g.potential).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">✅ Không có khoảng cách đáng kể — nhận thức của bạn khá chính xác với thực tế.</p>
            )}
          </div>
        </div>
      )}

      {/* Trạng thái hoàn thành */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">📋 Trạng thái hoàn thành</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>🪞 Tấm Gương Tự Biết Mình (G1)</span>
            <span className={hasG1 ? "text-green-400" : "text-muted-foreground"}>{hasG1 ? "✅ Đã hoàn thành" : "⬜ Chưa làm"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>🎬 Tình Huống Thực Tế (G2)</span>
            <span className={hasG2 ? "text-green-400" : "text-muted-foreground"}>{hasG2 ? "✅ Đã hoàn thành" : "⬜ Chưa làm"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>🔮 Số Mệnh (Tử Vi / Thần Số)</span>
            <span className={hasTuVi ? "text-green-400" : "text-muted-foreground"}>{hasTuVi ? "✅ Đã có" : "⬜ Chưa có"}</span>
          </div>
        </div>
        {(!hasG1 || !hasG2) && (
          <p className="text-xs text-muted-foreground mt-2">💡 Hoàn thành tất cả 3 lớp để NHÂN ẢNH chính xác nhất.</p>
        )}
      </div>
    </div>
  );
}
