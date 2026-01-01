"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginRequiredModal({
  isOpen,
  onClose,
  onLogin,
}: LoginRequiredModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-4">
        {/* 아이콘 */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* 메시지 */}
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            로그인이 필요합니다
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            주소를 발급받으려면 로그인이 필요합니다.
            <br />
            로그인하시겠습니까?
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button variant="primary" onClick={onLogin} className="flex-1">
            로그인 하기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
