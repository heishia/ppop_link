"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 120, className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-gray-200 flex-shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      {!imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${size}px`}
          priority
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          <User
            style={{
              width: size * 0.5,
              height: size * 0.5,
              strokeWidth: 1.5
            }}
          />
        </div>
      )}
    </div>
  );
}

