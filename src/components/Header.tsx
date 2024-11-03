'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  // 홈페이지에서는 헤더를 표시하지 않음
  if (pathname === '/') return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20 shadow-sm">
      <Link 
        href="/" 
        className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
          />
        </svg>
        <span>아무스토어</span>
      </Link>
    </header>
  );
} 