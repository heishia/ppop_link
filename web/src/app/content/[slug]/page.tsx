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
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  date: string;
  keywords: string[];
}

const contentData: Record<string, ContentData> = {
  "link-bio-guide": {
    slug: "link-bio-guide",
    title: "링크 바이오 완벽 가이드",
    description: "링크 바이오란 무엇인지, 어떻게 활용하는지 알아보는 완벽한 가이드입니다.",
    category: "가이드",
    date: "2025-01-10",
    keywords: ["링크바이오", "링크인바이오", "가이드", "사용법"],
    content: `
      <h2>링크 바이오란?</h2>
      <p>링크 바이오(Link in Bio)는 SNS 프로필에 하나의 링크만 추가할 수 있는 제한을 해결하기 위해 만들어진 서비스입니다. 여러 링크를 하나의 페이지에 모아서 관리하고 공유할 수 있습니다.</p>
      
      <h2>왜 링크 바이오가 필요한가요?</h2>
      <p>인스타그램, 틱톡 등 많은 SNS 플랫폼에서는 프로필에 하나의 링크만 추가할 수 있습니다. 하지만 여러 제품, 콘텐츠, 서비스를 홍보해야 하는 경우가 많죠. 링크 바이오를 사용하면 하나의 링크로 여러 페이지를 연결할 수 있습니다.</p>
      
      <h2>뽑링크로 시작하기</h2>
      <p>뽑링크는 무료로 제공되는 링크 바이오 서비스입니다. 간단한 가입만으로 바로 사용할 수 있으며, 제한 없이 링크를 추가하고 커스터마이징할 수 있습니다.</p>
      
      <h2>효과적인 링크 바이오 만들기</h2>
      <ul>
        <li>명확한 프로필 사진과 소개글 작성</li>
        <li>링크 제목을 명확하게 작성</li>
        <li>중요한 링크를 상단에 배치</li>
        <li>정기적으로 링크 업데이트</li>
      </ul>
    `,
  },
  "marketing-tips": {
    slug: "marketing-tips",
    title: "SNS 마케팅을 위한 링크 바이오 활용법",
    description: "인스타그램, 유튜브 등 SNS에서 링크 바이오를 효과적으로 활용하는 방법을 소개합니다.",
    category: "마케팅",
    date: "2025-01-05",
    keywords: ["마케팅", "SNS", "인스타그램", "유튜브", "홍보"],
    content: `
      <h2>SNS 마케팅과 링크 바이오</h2>
      <p>SNS 마케팅에서 링크 바이오는 매우 중요한 도구입니다. 팔로워들을 웹사이트, 제품 페이지, 랜딩 페이지로 유도하는 핵심 채널이죠.</p>
      
      <h2>인스타그램 활용법</h2>
      <p>인스타그램 프로필에 뽑링크 링크를 추가하고, 스토리나 포스트에서 "프로필 링크 확인"이라고 안내하세요. 여러 제품이나 콘텐츠를 홍보할 때 특히 유용합니다.</p>
      
      <h2>유튜브 활용법</h2>
      <p>유튜브 채널 설명란에 뽑링크를 추가하고, 영상 설명에도 언급하세요. 관련 영상, 제품, 서비스를 한 곳에 모아서 관리할 수 있습니다.</p>
      
      <h2>효과적인 전환율 높이기</h2>
      <ul>
        <li>명확한 CTA(행동 유도) 문구 사용</li>
        <li>링크 제목에 클릭 유도 문구 포함</li>
        <li>정기적으로 링크 순서 조정</li>
        <li>분석 기능으로 성과 측정</li>
      </ul>
    `,
  },
  "ppoplink-features": {
    slug: "ppoplink-features",
    title: "뽑링크 주요 기능 소개",
    description: "뽑링크의 핵심 기능들을 자세히 알아보고, 각 기능을 어떻게 활용하는지 설명합니다.",
    category: "프로그램 소개",
    date: "2025-01-01",
    keywords: ["뽑링크", "기능", "프로그램 소개", "사용법"],
    content: `
      <h2>뽑링크 주요 기능</h2>
      <p>뽑링크는 간단하고 직관적인 인터페이스로 링크 바이오를 만들고 관리할 수 있는 서비스입니다.</p>
      
      <h2>무제한 링크 추가</h2>
      <p>뽑링크는 링크 개수에 제한이 없습니다. 원하는 만큼 링크를 추가하고 관리할 수 있습니다.</p>
      
      <h2>프로필 커스터마이징</h2>
      <p>프로필 사진, 표시 이름, 소개글을 설정하여 나만의 링크 바이오를 만들 수 있습니다.</p>
      
      <h2>링크 순서 관리</h2>
      <p>드래그 앤 드롭으로 링크 순서를 쉽게 변경할 수 있습니다. 중요한 링크를 상단에 배치하세요.</p>
      
      <h2>분석 기능</h2>
      <p>각 링크의 클릭 수와 조회수를 확인하여 어떤 링크가 인기 있는지 파악할 수 있습니다.</p>
      
      <h2>공개 링크 페이지</h2>
      <p>만든 링크 바이오는 공개 링크로 공유할 수 있습니다. SNS 프로필이나 이메일 서명에 추가하세요.</p>
    `,
  },
};

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const content = contentData[params.slug];
  
  if (!content) {
    return {
      title: "컨텐츠를 찾을 수 없습니다",
    };
  }

  return {
    title: `${content.title} - 뽑링크 컨텐츠`,
    description: content.description,
    keywords: content.keywords.join(", "),
    openGraph: {
      title: content.title,
      description: content.description,
      type: "article",
    },
  };
}

export default function ContentDetailPage({ params }: ContentPageProps) {
  const content = contentData[params.slug];

  if (!content) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ppoplink.site";

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
            datePublished: content.date,
            dateModified: content.date,
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
            keywords: content.keywords.join(", "),
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
              <time className="text-xs text-gray-500" dateTime={content.date}>
                {content.date}
              </time>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {content.title}
            </h1>
            <p className="text-gray-600">{content.description}</p>
          </div>

          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700"
            dangerouslySetInnerHTML={{ __html: content.content }}
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

