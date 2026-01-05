import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api/public";
import { PublicProfileClient } from "@/components/public/PublicProfileClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: {
    linkId: string;
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  // 공개 링크 ID로 프로필 조회
  const linkId = params.linkId;

  try {
    const { data: profile } = await publicApi.getPublicProfile(linkId);

    return <PublicProfileClient profile={profile} />;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 404
    ) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const linkId = params.linkId;

  try {
    const { data: profile } = await publicApi.getPublicProfile(linkId);

    return {
      title: `${profile.display_name || profile.username} | PPOPLINK`,
      description: profile.bio || `Check out ${profile.username}'s links`,
      openGraph: {
        title: profile.display_name || profile.username,
        description: profile.bio || `Check out ${profile.username}'s links`,
        images: profile.profile_image_url
          ? [profile.profile_image_url]
          : undefined,
      },
    };
  } catch {
    return {
      title: "profile not found | PPOPLINK",
    };
  }
}

