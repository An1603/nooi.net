"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Unlink, CheckCircle, AlertCircle } from "lucide-react";

interface Identity {
  id: string;
  provider: string;
  identity_id: string;
  user_id: string;
  created_at: string;
  last_sign_in_at?: string;
  updated_at?: string;
}

const PROVIDER_LABELS: Record<string, { name: string; color: string }> = {
  email: { name: "Email / Mật khẩu", color: "text-blue-400" },
  google: { name: "Google", color: "text-red-400" },
  github: { name: "GitHub", color: "text-gray-300" },
};

const PROVIDER_ICONS: Record<string, string> = {
  email: "✉️",
  google: "🔴",
  github: "🐙",
};

export function AccountLinkingSection() {
  const supabase = createClient();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadIdentities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.identities) {
        setIdentities(user.identities as Identity[]);
      }
    } catch (err) {
      console.error("Failed to load identities:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadIdentities(); }, [loadIdentities]);

  const handleLink = useCallback(async (provider: "google" | "github") => {
    setLinking(provider);
    setError(null);
    setSuccess(null);
    try {
      const { error: linkError } = await supabase.auth.linkIdentity({ provider });
      if (linkError) throw linkError;
      setSuccess(`✅ Đã liên kết tài khoản ${PROVIDER_LABELS[provider]?.name || provider}`);
      await loadIdentities();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Liên kết thất bại";
      if (msg.includes("same_identity") || msg.includes("already linked")) {
        setError(`Tài khoản ${PROVIDER_LABELS[provider]?.name || provider} này đã được liên kết trước đó.`);
      } else {
        setError(msg);
      }
    } finally {
      setLinking(null);
    }
  }, [supabase, loadIdentities]);

  const handleUnlink = useCallback(async (identity: Identity) => {
    if (identities.length <= 1) {
      setError("Không thể bỏ liên kết cuối cùng. Cần ít nhất 1 phương thức đăng nhập.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
      if (unlinkError) throw unlinkError;
      setSuccess(`✅ Đã bỏ liên kết ${PROVIDER_LABELS[identity.provider]?.name || identity.provider}`);
      await loadIdentities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bỏ liên kết thất bại");
    }
  }, [identities, supabase, loadIdentities]);

  const providersToLink = ["google", "github"].filter(
    p => !identities.some(i => i.provider === p)
  );

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Đang tải...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {identities.map((id) => {
          const info = PROVIDER_LABELS[id.provider] || { name: id.provider, color: "text-muted-foreground" };
          return (
            <div key={id.identity_id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border ${info.color} text-xs`}>
              <span>{PROVIDER_ICONS[id.provider] || "🔑"}</span>
              <span>{info.name}</span>
              <button
                onClick={() => handleUnlink(id)}
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                title="Bỏ liên kết"
              >
                <Unlink className="size-3" />
              </button>
            </div>
          );
        })}
      </div>

      {providersToLink.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <p className="text-[10px] text-muted-foreground w-full">Liên kết thêm tài khoản:</p>
          {providersToLink.map((p) => (
            <Button key={p} type="button" variant="outline" size="sm"
              onClick={() => handleLink(p as "google" | "github")}
              disabled={linking !== null}
              className="text-xs gap-1.5"
            >
              {linking === p ? <Loader2 className="size-3 animate-spin" /> : <Link2 className="size-3" />}
              {PROVIDER_LABELS[p]?.name || p}
            </Button>
          ))}
        </div>
      )}

      {success && <p className="text-[11px] text-emerald-400">{success}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <p className="text-[10px] text-muted-foreground">
        Liên kết nhiều tài khoản cho phép bạn đăng nhập bằng bất kỳ phương thức nào vào cùng một tài khoản NOOI.
      </p>
    </div>
  );
}
