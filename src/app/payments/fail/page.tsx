'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const code = searchParams.get('code');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h1>
        <p className="text-gray-600 mb-4">결제 중 문제가 발생했습니다.</p>
        {message && <p className="text-sm text-gray-500 mb-2">사유: {message}</p>}
        {code && <p className="text-sm text-gray-500 mb-4">에러 코드: {code}</p>}
        <Link 
          href="/checkout"
          className="block w-full text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          다시 시도하기
        </Link>
      </div>
    </div>
  );
} 