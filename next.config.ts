import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), '@react-pdf/renderer', 'canvas']
    }
    return config
  },
}
export default nextConfig
