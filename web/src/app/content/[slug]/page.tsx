import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";

interface ContentPageProps {
  params: {
    slug: string;
  };
}

interface ContentData {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  published_at: string | null;
  created_at: string;
}

// 서버 사이드에서 컨텐츠 가져오기
async function getContent(slug: string): Promise<ContentData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/content/${slug}`, {
      cache: "no-store", // 항상 최신 데이터 가져오기
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch content:", error);
    return null;
  }
}


export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const content = await getContent(params.slug);
  
  if (!content) {
    return {
      title: "컨텐츠를 찾을 수 없습니다",
    };
  }

  return {
    title: `${content.title} - 뽑링크 컨텐츠`,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      type: "article",
    },
  };
}

export default async function ContentDetailPage({ params }: ContentPageProps) {
  const content = await getContent(params.slug);

  if (!content) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site";
  
  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 마크다운 형식의 content를 HTML로 변환 (간단한 변환)
  const formatContent = (text: string) => {
    return text
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[hul])/gm, "<p>")
      .replace(/(?<![>])$/gm, "</p>");
  };

  return (
    <div className="min-h-screen bg-white">
      <MainHeader />
      {/* 구조화된 데이터 - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: content.title,
            description: content.description,
            datePublished: content.published_at || content.created_at,
            dateModified: content.created_at,
            author: {
              "@type": "Person",
              name: "김뽑희",
            },
            publisher: {
              "@type": "Organization",
              name: "PPOP",
              logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/screenshot.png`,
              },
            },
              mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${baseUrl}/content/${content.slug}`,
            },
          }),
        }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <Link
          href="/content"
          className="text-primary hover:text-primary/80 mb-6 inline-block"
        >
          ← 컨텐츠 목록으로
        </Link>

        <article>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {content.category}
              </span>
              <time className="text-xs text-gray-500" dateTime={content.published_at || content.created_at}>
                {formatDate(content.published_at)}
              </time>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {content.title}
            </h1>
            <p className="text-gray-600">{content.description}</p>
          </div>

          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700"
            dangerouslySetInnerHTML={{ __html: formatContent(content.content) }}
            itemProp="articleBody"
          />
        </article>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <Link
            href="/content"
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← 다른 컨텐츠 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

