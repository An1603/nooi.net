"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BrandUrls {
  "logo-horizontal": string;
  "logo-horizontal-white": string;
  "logo-square": string;
  "logo-square-white": string;
  "logo-icon": string;
  "logo-icon-white": string;
}

const DEFAULTS: BrandUrls = {
  "logo-horizontal": "/brand/nooi-horizontal.png",
  "logo-horizontal-white": "/brand/nooi-horizontal-white.png",
  "logo-square": "/brand/nooi-stacked.png",
  "logo-square-white": "/brand/nooi-stacked-white.png",
  "logo-icon": "/brand/nooi-icon-v.png",
  "logo-icon-white": "/brand/nooi-icon-v-white.png",
};

const BrandContext = createContext<BrandUrls>(DEFAULTS);

/**
 * BrandProvider — tải brand config từ API và cung cấp URL qua context.
 * Bọc toàn bộ app trong layout.
 */
export function BrandProvider({ children }: { children: ReactNode }) {
  const [urls, setUrls] = useState<BrandUrls>(DEFAULTS);

  useEffect(() => {
    fetch("/api/admin/brand")
      .then((res) => res.json())
      .then((config) => {
        if (config?.assets) {
          const mapped: Partial<BrandUrls> = {};
          for (const key of Object.keys(DEFAULTS)) {
            if (config.assets[key]?.url) {
              mapped[key as keyof BrandUrls] = config.assets[key].url;
            }
          }
          setUrls((prev) => ({ ...prev, ...mapped }));
        }
      })
      .catch(() => {});
  }, []);

  return <BrandContext.Provider value={urls}>{children}</BrandContext.Provider>;
}

/**
 * Hook lấy brand URL. Dùng trong các component client.
 */
export function useBrandUrl(key: keyof BrandUrls): string {
  const urls = useContext(BrandContext);
  return urls[key] || DEFAULTS[key];
}
