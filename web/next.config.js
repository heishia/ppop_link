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

// Sentry 설정 - 환경 변수가 있을 때만 소스맵 업로드
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

// Sentry 환경 변수가 설정되어 있을 때만 Sentry 설정 적용
if (sentryOrg && sentryProject) {
  module.exports = withSentryConfig(
    nextConfig,
    {
      silent: true,
      org: sentryOrg,
      project: sentryProject,
    },
    {
      widenClientFileUpload: true,
      transpileClientSDK: true,
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
      disableLogger: true,
    }
  );
} else {
  // Sentry 환경 변수가 없으면 일반 Next.js 설정만 사용
  module.exports = nextConfig;
}

