import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 🔹 Limit file tracing to THIS project (fixes EPERM scandir on C:\users\...)
  outputFileTracingRoot: path.join(__dirname),

  // Add empty turbopack config to allow transition while keeping webpack config
  turbopack: {},

  experimental: {
    // (Optional but often helps on Windows)
    workerThreads: false,
    cpus: 1,
  },

  // Configure webpack for Socket.IO
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      {
        "utf-8-validate": "commonjs utf-8-validate",
        bufferutil: "commonjs bufferutil",
      },
    ];
    return config;
  },

  // Prevent ERR_ABORTED errors by increasing timeouts
  httpAgentOptions: {
    keepAlive: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
