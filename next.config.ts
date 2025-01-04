import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  compiler: {
    emotion: true,
  },
};

export default nextConfig;