const { withAikoApp } = require('@michalsy/aiko-webapp-core/next-config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Custom webpack config if needed
    return config
  },
  // Use webpack explicitly
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = withAikoApp(nextConfig)
