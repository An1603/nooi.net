"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function VerifiedToastNotifier() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success("Email đã được xác minh thành công! Bạn có thể tiếp tục sử dụng tài khoản.");
      const params = new URLSearchParams(searchParams);
      params.delete("verified");
      const newUrl = `${pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [pathname, searchParams]);

  return null;
}
