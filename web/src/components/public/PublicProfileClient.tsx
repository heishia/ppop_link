"use client";

import React, { useEffect, useState } from "react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { Avatar } from "@/components/ui/Avatar";
import { PublicProfile } from "@/lib/api/public";
import { PublicLinkButton } from "./PublicLinkButton";
import { SocialIcons } from "./SocialIcons";
import { ContactModal } from "./ContactModal";
import { DEFAULT_BACKGROUND_COLOR, isDarkColor } from "@/lib/constants/colors";
import { getGoogleFontUrl } from "@/lib/constants/fonts";

interface PublicProfileClientProps {
  profile: PublicProfile;
}

export function PublicProfileClient({ profile }: PublicProfileClientProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const activeLinks = profile.links.filter((link) => link.is_active);
  const activeSocialLinks = profile.social_links.filter(
    (link) => link.is_active
  );

  const bgColor = profile.background_color || DEFAULT_BACKGROUND_COLOR;
  const dark = isDarkColor(bgColor);
  const fontFamily = profile.font_family || "default";
  const googleFontUrl = getGoogleFontUrl(fontFamily);
  const hasContactEmail = !!profile.contact_email;
  
  const fontStyle = fontFamily === "default" 
    ? { fontFamily: "Iseoyun, sans-serif" }
    : { fontFamily: `"${fontFamily}", sans-serif` };

  useEffect(() => {
    if (!googleFontUrl) return;
    
    const existingLink = document.querySelector(`link[href="${googleFontUrl}"]`);
    if (existingLink) return;
    
    const link = document.createElement("link");
    link.href = googleFontUrl;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [googleFontUrl]);

  return (
    <main
      className="min-h-screen py-8 sm:py-12 md:py-16"
      style={{ backgroundColor: bgColor, ...fontStyle }}
    >
      <MobileContainer>
        {/* Profile Section */}
        <section className="flex flex-col items-center py-8">
          <Avatar
            src={profile.profile_image_url || "/avatar-placeholder.jpg"}
            alt={profile.display_name || profile.username}
          />
          <h1 className={`mt-4 text-center font-extrabold text-username ${dark ? "text-white" : ""}`}>
            {profile.display_name || profile.username}
          </h1>
          {profile.bio && (
            <p className={`mt-2 text-center font-normal text-bio whitespace-pre-line ${dark ? "text-gray-300" : ""}`}>
              {profile.bio}
            </p>
          )}
        </section>

        {/* Social Links */}
        {activeSocialLinks.length > 0 && (
          <SocialIcons socialLinks={activeSocialLinks} />
        )}

        {/* Links */}
        <section className="flex flex-col gap-4 py-6 pb-16">
          {activeLinks.map((link) => (
            <PublicLinkButton
              key={link.id}
              link={link}
              publicLinkId={profile.public_link_id}
              buttonStyle={profile.button_style || "default"}
            />
          ))}
        </section>
      </MobileContainer>

      <footer className="fixed bottom-0 left-0 right-0 flex justify-center py-3 pointer-events-none">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto text-2xl sm:text-3xl font-bold text-primary/50 transition-all hover:text-primary hover:scale-105"
          style={{ fontFamily: "Iseoyun, sans-serif" }}
        >
          PPOPLINK
        </a>
      </footer>

      {hasContactEmail && (
        <button
          onClick={() => setIsContactModalOpen(true)}
          className={`fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse-slow ${dark ? "text-white" : "text-gray-900"}`}
          aria-label="메시지 보내기"
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </button>
      )}

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contactEmail={profile.contact_email || ""}
        contactMessage={profile.contact_message}
      />
    </main>
  );
}
