import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/auth/", "/admin-login"],
    },
    sitemap: "https://nooi.net/sitemap.xml",
  };
}
