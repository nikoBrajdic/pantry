import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dodaj", destination: "/add", permanent: false },
      { source: "/kuhinja", destination: "/kitchen", permanent: false },
      { source: "/dijeli", destination: "/share", permanent: false },
      { source: "/uvezak", destination: "/import", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Allow Screen Wake Lock for “I'm cooking” (some hosts/policies omit it).
          {
            key: "Permissions-Policy",
            value: "screen-wake-lock=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
