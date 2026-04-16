/**
 * 파스텔 톤 배경색 팔레트 정의
 * 사용자가 선택할 수 있는 예쁜 파스텔 색상들
 */

export interface PastelColor {
  id: string;
  name: string;
  nameKo: string;
  hex: string;
}

export const PASTEL_COLORS: PastelColor[] = [
  {
    id: "white",
    name: "Pure White",
    nameKo: "화이트",
    hex: "#FFFFFF",
  },
  {
    id: "ivory",
    name: "Ivory Cream",
    nameKo: "아이보리",
    hex: "#FFFAF5",
  },
  {
    id: "pink_blossom",
    name: "Pink Blossom",
    nameKo: "벚꽃 핑크",
    hex: "#FFD6E8",
  },
  {
    id: "rose_quartz",
    name: "Rose Quartz",
    nameKo: "로즈 쿼츠",
    hex: "#F5E1E9",
  },
  {
    id: "peach_sorbet",
    name: "Peach Sorbet",
    nameKo: "피치 소르베",
    hex: "#FFE5D4",
  },
  {
    id: "apricot",
    name: "Soft Apricot",
    nameKo: "살구빛",
    hex: "#FFE8D6",
  },
  {
    id: "lemon_cream",
    name: "Lemon Cream",
    nameKo: "레몬 크림",
    hex: "#FFF9E3",
  },
  {
    id: "mint_green",
    name: "Mint Green",
    nameKo: "민트 그린",
    hex: "#D8F5E3",
  },
  {
    id: "sky_blue",
    name: "Sky Blue",
    nameKo: "하늘색",
    hex: "#D6EEFF",
  },
  {
    id: "baby_blue",
    name: "Baby Blue",
    nameKo: "베이비 블루",
    hex: "#E3F4FF",
  },
  {
    id: "lavender",
    name: "Lavender Dream",
    nameKo: "라벤더",
    hex: "#E8DEFF",
  },
  {
    id: "lilac",
    name: "Soft Lilac",
    nameKo: "라일락",
    hex: "#F0E6FF",
  },
  {
    id: "black",
    name: "Black",
    nameKo: "블랙",
    hex: "#000000",
  },
];

// 기본 배경색 (화이트)
export const DEFAULT_BACKGROUND_COLOR = "#FFFFFF";

// 배경색이 어두운지 판별 (텍스트 색상 반전 용도)
export function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// hex 값으로 컬러 정보 찾기
export function getColorByHex(hex: string): PastelColor | undefined {
  return PASTEL_COLORS.find(
    (color) => color.hex.toLowerCase() === hex.toLowerCase()
  );
}

// ID로 컬러 정보 찾기
export function getColorById(id: string): PastelColor | undefined {
  return PASTEL_COLORS.find((color) => color.id === id);
}

