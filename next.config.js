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
    domains: ["backend-project-r734.onrender.com", "teal-parrot.s3.eu-north-1.amazonaws.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  // The option has been moved from experimental to the root level in Next.js 15
  serverExternalPackages: ["sharp"],
  // Output configuration for better static optimization
  output: "standalone",
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // Increase the timeout for builds on Vercel
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Add HTTP headers to prevent indexing
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nositelinkssearchbox, nosnippet, notranslate, noimageindex",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
