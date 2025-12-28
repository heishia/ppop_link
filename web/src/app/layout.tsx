import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "뽑링크 - 링크를 모아주는 링크 바이오 서비스",
    template: "%s | 뽑링크",
  },
  description: "간단하고 예쁜 링크 바이오를 무료로 만들어보세요. 무제한 링크 추가, 커스터마이징, 분석 기능까지 모든 기능을 무료로 제공합니다.",
  keywords: ["뽑링크", "링크바이오", "링크인바이오", "링크트리", "바이오링크", "무료 링크바이오", "SNS 링크"],
  authors: [{ name: "PPOP", url: "https://ppoplink.site" }],
  creator: "김뽑희",
  publisher: "PPOP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "뽑링크",
    title: "뽑링크 - 링크를 모아주는 링크 바이오 서비스",
    description: "간단하고 예쁜 링크 바이오를 무료로 만들어보세요.",
    images: [
      {
        url: "/screenshot.png",
        width: 1200,
        height: 630,
        alt: "뽑링크 미리보기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "뽑링크 - 링크를 모아주는 링크 바이오 서비스",
    description: "간단하고 예쁜 링크 바이오를 무료로 만들어보세요.",
    images: ["/screenshot.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cafe24+Ssurround&display=swap"
          rel="stylesheet"
        />
        {/* 네이버 검색 최적화 */}
        <meta name="robots" content="index, follow" />
        <meta name="Yeti" content="index, follow" />
        <meta name="naver-site-verification" content={process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || ""} />
        {/* 구조화된 데이터 - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PPOP",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site",
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site"}/screenshot.png`,
              description: "링크를 모아주는 링크 바이오 서비스 뽑링크",
              founder: {
                "@type": "Person",
                name: "김뽑희",
              },
            }),
          }}
        />
        {/* 구조화된 데이터 - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "뽑링크",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site",
              description: "간단하고 예쁜 링크 바이오를 무료로 만들어보세요.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site"}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

