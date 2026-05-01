import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Single funnel: collapse the parallel /build/* entry points into the homepage.
      // /build/results/[orderId] and /build/interview-prep/[orderId] are KEPT
      // because existing paid orders link to them.
      { source: '/build', destination: '/', permanent: true },
      { source: '/build/form', destination: '/', permanent: true },

      // Standalone /templates and /pricing pages duplicated content already on the
      // homepage; redirect to the homepage anchors.
      { source: '/templates', destination: '/#templates', permanent: true },
      { source: '/pricing', destination: '/#pricing', permanent: true },
    ];
  },
};

export default nextConfig;
