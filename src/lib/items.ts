// API client functions for Digital Items Store

/**
 * Fetch all digital items, optionally filtered by category.
 */
export async function getItems(category?: string): Promise<Item[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const res = await fetch(`/api/items?${params}`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

/**
 * Fetch items the current user has already unlocked.
 */
export async function getMyItems(): Promise<string[]> {
  const res = await fetch("/api/items/mine");
  if (!res.ok) throw new Error("Failed to fetch user items");
  const data = await res.json();
  return data.map((i: { item_id: string }) => i.item_id);
}

/**
 * Unlock an item by spending N.
 */
export async function unlockItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/items/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    return await res.json();
  } catch {
    return { success: false, error: "Không thể kết nối máy chủ." };
  }
}

/**
 * Download an item file (gets signed URL, then triggers browser download).
 */
export async function downloadItem(itemId: string, itemSlug: string, fileName: string) {
  try {
    // Special case: certificate is generated dynamically
    if (itemSlug === "certificate-level") {
      window.open("/api/items/certificate", "_blank");
      return;
    }
    const res = await fetch(`/api/items/${itemId}/download`);
    if (!res.ok) throw new Error("Download failed");
    const { url } = await res.json();
    // Trigger download via hidden anchor
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    throw new Error("Không thể tải file. Vui lòng thử lại.");
  }
}

/**
 * Sync auto-unlock badges for the current user.
 * Returns list of newly unlocked badge IDs.
 */
export async function syncBadges(): Promise<string[]> {
  try {
    const res = await fetch("/api/items/sync-badges", { method: "POST" });
    const data = await res.json();
    return data.unlocked || [];
  } catch {
    return [];
  }
}

/**
 * Gift an item to a friend by their referral code.
 */
export async function giftItem(
  itemId: string,
  recipientCode: string,
  message?: string
): Promise<{ success: boolean; error?: string; recipientName?: string }> {
  try {
    const res = await fetch("/api/items/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, recipientCode, message }),
    });
    return await res.json();
  } catch {
    return { success: false, error: "Không thể kết nối máy chủ." };
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Item {
  id: string;
  name: string;
  slug: string;
  category: "hoc-tap" | "ky-niem" | "qua-tang";
  type: "image" | "pdf" | "svg";
  image_url: string | null;
  file_url: string | null;
  price_n: number;
  level_required: number;
  auto_unlock: boolean;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface UserItem {
  id: string;
  user_id: string;
  item_id: string;
  unlocked_at: string;
  source: string;
}
