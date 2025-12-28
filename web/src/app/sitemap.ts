import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site";

  const routes = [
    "",
    "/help",
    "/about",
    "/updates",
    "/content",
    "/content/link-bio-guide",
    "/content/marketing-tips",
    "/content/ppoplink-features",
    "/login",
    "/register",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}

