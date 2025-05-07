/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["backend-project-r734.onrender.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  // The option has been moved from experimental to the root level
  serverExternalPackages: ["sharp"],
  // Remove this section if it only contained serverComponentsExternalPackages
  // experimental: {
  //   serverComponentsExternalPackages: ["sharp"],
  // },
}

module.exports = nextConfig
