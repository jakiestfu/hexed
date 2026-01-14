import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  // devIndicators: false,
  output: 'export'
  // Path aliases are handled by tsconfig.json
};

export default nextConfig;
