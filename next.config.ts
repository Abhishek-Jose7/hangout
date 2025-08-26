import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Server Components strict mode to prevent RSC errors
  experimental: {
    // This helps with RSC-related network errors
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configure webpack for Socket.IO
  webpack: (config) => {
    config.externals = [...(config.externals || []), {
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    }];
    return config;
  },
  // Prevent ERR_ABORTED errors by increasing timeouts
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;