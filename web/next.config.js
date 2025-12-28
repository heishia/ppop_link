/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_PPOP_AUTH_CLIENT_ORIGIN: process.env.NEXT_PUBLIC_PPOP_AUTH_CLIENT_ORIGIN,
    NEXT_PUBLIC_PPOP_AUTH_SERVICE_CODE: process.env.NEXT_PUBLIC_PPOP_AUTH_SERVICE_CODE,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Sentry configuration
  sentry: {
    hideSourceMaps: true,
  },
}

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  }
);

