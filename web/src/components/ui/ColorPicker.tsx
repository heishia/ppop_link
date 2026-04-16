"use client";

import React from "react";
import { PASTEL_COLORS, PastelColor } from "@/lib/constants/colors";

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  disabled?: boolean;
}

// 파스텔 컬러 팔레트에서 배경색을 선택하는 컴포넌트
export function ColorPicker({
  selectedColor,
  onColorSelect,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {PASTEL_COLORS.map((color) => (
          <ColorSwatch
            key={color.id}
            color={color}
            isSelected={selectedColor.toLowerCase() === color.hex.toLowerCase()}
            onClick={() => onColorSelect(color.hex)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

interface ColorSwatchProps {
  color: PastelColor;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ColorSwatch({ color, isSelected, onClick, disabled }: ColorSwatchProps) {
  const isDark = color.hex.toLowerCase() === "#000000";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex flex-col items-center gap-1.5
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
      title={color.nameKo}
    >
      <div
        className={`
          h-12 w-12 rounded-full border-2 shadow-sm
          transition-all duration-200 ease-out
          ${
            isSelected
              ? isDark
                ? "scale-110 border-white ring-2 ring-gray-400"
                : "scale-110 border-primary ring-2 ring-primary/30"
              : isDark
                ? "border-gray-600 hover:scale-105 hover:border-gray-400 hover:shadow-md"
                : "border-gray-200 hover:scale-105 hover:border-gray-300 hover:shadow-md"
          }
          ${disabled ? "" : "active:scale-95"}
        `}
        style={{ backgroundColor: color.hex }}
      >
        {isSelected && (
          <div className="flex h-full items-center justify-center">
            <svg
              className={`h-5 w-5 drop-shadow-sm ${isDark ? "text-white" : "text-primary"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* 색상 이름 */}
      <span
        className={`
          text-[10px] font-medium leading-tight text-center
          ${isSelected ? "text-primary" : "text-gray-500"}
        `}
      >
        {color.nameKo}
      </span>
    </button>
  );
}

