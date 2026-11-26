import type { NextConfig } from "next";

// Served under https://service.nurse.cmu.ac.th/dev/nursegift (fixed at build time).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/dev/nursegift";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  output: "standalone",
  // The bare base URL (/dev/nursegift) isn't seen by proxy.ts; send it to the Thai home page.
  async redirects() {
    return [{ source: "/", destination: "/th", permanent: false }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    // Excel/backup uploads go through Server Actions (PHP allowed 5MB files).
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
