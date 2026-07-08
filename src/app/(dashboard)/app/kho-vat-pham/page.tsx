"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Layers, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getItems, getMyItems, unlockItem, downloadItem, syncBadges } from "@/lib/items";
import type { Item } from "@/lib/items";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemGrid } from "@/components/items/ItemGrid";
import { ItemModal } from "@/components/items/ItemModal";
import { toast } from "sonner";

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1200, 2200, 3500];
const LEVEL_NAMES = ["Member 🌰", "Seeker 🌱", "Grower 🌿", "Giver 🌳", "Guider 🌲", "Mentor 🌳", "Master 👑"];

function getLevel(n: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (n >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [myItemIds, setMyItemIds] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [userN, setUserN] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadData = useCallback(async () => {
    try {
      const allItems = await getItems(category || undefined);
      setItems(allItems);

      // My items — may fail for unauthenticated users, don't block
      try {
        const ownedIds = await getMyItems();
        setMyItemIds(ownedIds);
      } catch {
        setMyItemIds([]);
      }

      // Get user N
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("file_type", "journal");
        const n = (count ?? 0) * 10;
        setUserN(n);
        setUserLevel(getLevel(n));

        // Auto-unlock badges based on level
        const newBadges = await syncBadges();
        if (newBadges.length > 0) {
          setMyItemIds((prev) => [...prev, ...newBadges]);
        }
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUnlock = useCallback(
    async (itemId: string) => {
      setUnlocking(itemId);
      const result = await unlockItem(itemId);
      if (result.success) {
        toast.success("✅ Đã mở khóa vật phẩm!");
        setMyItemIds((prev) => [...prev, itemId]);
        setSelectedItem(null); // Close modal
      } else {
        // If not logged in, redirect to login
        if (result.error?.includes("đăng nhập") || result.error?.includes("Unauthorized")) {
          toast.error("Vui lòng đăng nhập trước.");
          router.push("/login?redirect=/app/kho-vat-pham");
        } else {
          toast.error(result.error || "Không thể mở khóa.");
        }
      }
      setUnlocking(null);
    },
    [router]
  );

  const handleDownload = useCallback(async (item: Item) => {
    try {
      await downloadItem(item.id, item.slug, `${item.slug}.${item.type === "pdf" ? "pdf" : "png"}`);
      toast.success(`Đang tải ${item.name}...`);
    } catch {
      toast.error("Không thể tải file.");
    }
  }, []);

  const filteredItems = category ? items.filter((i) => i.category === category) : items;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kho vật phẩm</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Công cụ học tập, kỷ niệm hành trình và quà tặng tri thức
            </p>
          </div>
        </div>
        {/* User N + Level */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Của bạn</p>
            <p className="text-sm font-bold">{userN} N</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            {LEVEL_NAMES[userLevel - 1]}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm">
            Đã mở khóa <strong className="text-primary">{myItemIds.length}</strong>/{items.length} vật phẩm
          </p>
          <div className="mt-1.5 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${items.length > 0 ? (myItemIds.length / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <ItemGrid activeCategory={category} onCategoryChange={setCategory} items={items}>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted/30" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-muted/30 rounded w-3/4" />
                  <div className="h-3 bg-muted/20 rounded w-1/2" />
                  <div className="h-8 bg-muted/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-1">Chưa có vật phẩm nào</p>
            <p className="text-sm">Đang cập nhật...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer">
                <ItemCard
                  item={item}
                  owned={myItemIds.includes(item.id)}
                  userN={userN}
                  userLevel={userLevel}
                  onUnlock={handleUnlock}
                  onDownload={handleDownload}
                  unlocking={unlocking === item.id}
                />
              </div>
            ))}
          </div>
        )}
      </ItemGrid>

      {/* Modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          owned={myItemIds.includes(selectedItem.id)}
          userN={userN}
          userLevel={userLevel}
          onUnlock={handleUnlock}
          onDownload={handleDownload}
          onClose={() => setSelectedItem(null)}
          unlocking={unlocking === selectedItem.id}
        />
      )}
    </div>
  );
}
