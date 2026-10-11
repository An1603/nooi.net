"use client";

import { useState } from "react";

/**
 * Liên kết người thân với bé: tạo mã liên kết theo vai trò và tìm người thân theo tên.
 */
export function RelativeLink({ kidId }: { kidId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [role, setRole] = useState("cha");

  async function makeCode() {
    const r = await fetch("/api/ekid/caregivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kid_id: kidId, role }),
    });
    const d = await r.json();
    if (d.caregiver?.link_code) setCode(d.caregiver.link_code);
  }

  async function search() {
    const r = await fetch(`/api/ekid/caregivers?q=${encodeURIComponent(q)}&kid_id=${kidId}`);
    const d = await r.json();
    setResults(d.users ?? []);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="cha">Cha</option>
          <option value="me">Mẹ</option>
          <option value="nguoi-giam-ho">Người giám hộ</option>
        </select>
        <button
          onClick={makeCode}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Tạo mã liên kết
        </button>
      </div>
      {code && (
        <p className="text-lg font-semibold text-primary">
          Mã liên kết: <span className="tracking-widest">{code}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên người thân..."
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <button
          onClick={search}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground"
        >
          Tìm
        </button>
      </div>
      <ul className="space-y-1">
        {results.map((u) => (
          <li
            key={u.user_id}
            className="rounded-lg border border-border bg-glass px-3 py-2 text-sm text-foreground"
          >
            {u.full_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
