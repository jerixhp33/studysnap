import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=self, microphone=()' },
        ],
      },
    ]
  },

  // Image optimisation
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // Don't bundle these server-only packages on the client
  serverExternalPackages: ['pdf-parse', 'nodemailer', 'tesseract.js'],

  // Turbopack config (Next 16 default bundler)
  turbopack: {
    // Suppress pdf-parse canvas warning
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },

  compress: true,
  reactStrictMode: true,
  trailingSlash: false,
}

export default nextConfig
