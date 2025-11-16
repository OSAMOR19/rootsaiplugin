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
      
      // Allow WASM files for Essentia.js
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
      
      // Handle .wasm files
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    }
    return config;
  },
  // Ensure WASM files are copied to output
  experimental: {
    serverComponentsExternalPackages: ['essentia.js'],
  },
}

export default nextConfig
