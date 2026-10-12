/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
