import { FontFamily } from "@/lib/api/auth";

export interface FontOption {
  value: FontFamily;
  label: string;
  googleFont?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: "default", label: "기본 (이서윤체)" },
  { value: "Noto Sans KR", label: "Noto Sans KR", googleFont: "Noto+Sans+KR:wght@400;700" },
  { value: "Nanum Gothic", label: "나눔고딕", googleFont: "Nanum+Gothic:wght@400;700" },
  { value: "Gowun Batang", label: "고운바탕", googleFont: "Gowun+Batang:wght@400;700" },
];

export function getGoogleFontUrl(fontFamily: FontFamily): string | null {
  const option = FONT_OPTIONS.find((f) => f.value === fontFamily);
  if (!option?.googleFont) return null;
  return `https://fonts.googleapis.com/css2?family=${option.googleFont}&display=swap`;
}

