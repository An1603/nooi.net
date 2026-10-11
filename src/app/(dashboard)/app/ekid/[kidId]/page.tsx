import { KidConsole } from "./KidConsole";
import { parseTab } from "./types";

export const dynamic = "force-dynamic";

/**
 * Console của một con — shell server đọc `?tab=` rồi giao cho KidConsole (client) tải dữ liệu.
 * Bốn tab: account (mặc định) | relatives | report | settings.
 */
export default async function KidConsolePage({
  params,
  searchParams,
}: {
  params: Promise<{ kidId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { kidId } = await params;
  const { tab } = await searchParams;
  return <KidConsole kidId={kidId} tab={parseTab(tab)} />;
}
