"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
}

// 크롭된 이미지를 Blob으로 변환하는 유틸리티 함수
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  // 출력 크기 설정 (최대 500x500)
  const maxSize = 500;
  const outputSize = Math.min(maxSize, Math.max(pixelCrop.width, pixelCrop.height));

  canvas.width = outputSize;
  canvas.height = outputSize;

  // 원형 클리핑을 위한 배경 투명 처리
  ctx.fillStyle = "transparent";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 이미지 그리기
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/jpeg",
      0.9
    );
  });
}

// 이미지 로드 헬퍼 함수
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      handleClose();
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crop Profile Picture">
      <div className="space-y-4">
        {/* 크롭 영역 */}
        <div className="relative h-[300px] w-full bg-gray-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* 줌 슬라이더 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <label htmlFor="zoom-slider">Zoom</label>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            id="zoom-slider"
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="이미지 확대/축소"
          />
        </div>

        {/* 안내 텍스트 */}
        <p className="text-xs text-gray-500 text-center">
          Drag to move, scroll to zoom
        </p>

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
            className="flex-1"
          >
            {isProcessing ? "Processing..." : "Apply"}
          </Button>
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

