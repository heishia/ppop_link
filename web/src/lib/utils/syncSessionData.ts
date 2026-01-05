import { profileApi } from "@/lib/api/profile";
import { linksApi } from "@/lib/api/links";

export async function syncSessionDataToServer() {
  try {
    // 프로필 동기화
    const tempProfile = sessionStorage.getItem("temp_profile");
    if (tempProfile) {
      const profile = JSON.parse(tempProfile);
      await profileApi.updateProfile(profile);
      sessionStorage.removeItem("temp_profile");
    }
    
    // 링크 동기화
    const tempLinks = sessionStorage.getItem("temp_links");
    if (tempLinks) {
      const links = JSON.parse(tempLinks);
      for (const link of links) {
        if (link.id.startsWith("temp_")) {
          await linksApi.createLink({
            title: link.title,
            url: link.url,
          });
        }
      }
      sessionStorage.removeItem("temp_links");
    }
    
    // 소셜 링크 동기화
    const tempSocialLinks = sessionStorage.getItem("temp_social_links");
    if (tempSocialLinks) {
      const socialLinks = JSON.parse(tempSocialLinks);
      for (const link of socialLinks) {
        if (link.id.startsWith("temp_")) {
          await linksApi.createSocialLink({
            platform: link.platform,
            url: link.url,
          });
        }
      }
      sessionStorage.removeItem("temp_social_links");
    }
    
    console.log("Session data synced successfully");
  } catch (error) {
    console.error("Failed to sync session data:", error);
    // 실패해도 계속 진행
  }
}

