'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  // 홈페이지에서는 헤더를 숨김
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50 flex items-center justify-center">
      <Link 
        href="/" 
        className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
      >
        아무 스토어
      </Link>
    </header>
  );
} 