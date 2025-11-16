/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle ffmpeg-static binary - use the actual file
      config.externals = config.externals || [];
      config.externals.push({
        'ffmpeg-static': 'commonjs ffmpeg-static'
      });
    }
    return config;
  },
}

export default nextConfig
