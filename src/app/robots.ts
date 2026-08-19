import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here should ever be indexed: the console, a shopper's own account,
      // and anything holding an order reference.
      disallow: ["/admin", "/account", "/checkout", "/cart", "/track/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
