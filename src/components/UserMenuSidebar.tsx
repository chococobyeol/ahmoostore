'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UserMenuSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 z-30"
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
      </button>

      {/* 사이드바 */}
      <div
        className={`fixed left-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">메뉴</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 메뉴 항목들 */}
          <nav className="flex-1">
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/register" 
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  회원가입
                </Link>
              </li>
              <li>
                <Link 
                  href="/login" 
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  로그인
                </Link>
              </li>
              <li>
                <Link 
                  href="/my-account" 
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  마이페이지
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
} 