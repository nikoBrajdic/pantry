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
};

export default nextConfig;
