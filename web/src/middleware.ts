import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { hostname } = request.nextUrl;

  // www로 접속한 경우 non-www로 리다이렉트
  if (hostname === "www.ppoplink.site") {
    const url = request.nextUrl.clone();
    url.hostname = "ppoplink.site";

    return NextResponse.redirect(url, 301); // 영구 리다이렉트
  }

  return NextResponse.next();
}

// 모든 경로에 적용
export const config = {
  matcher: "/:path*",
};
