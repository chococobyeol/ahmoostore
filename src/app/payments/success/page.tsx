'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-4">결제 성공</h1>
        <div className="text-gray-600 mb-6">
          <p>결제가 성공적으로 완료되었습니다.</p>
          {orderId && <p className="mt-2">주문번호: {orderId}</p>}
          {amount && <p className="mt-2">결제금액: {parseInt(amount).toLocaleString()}원</p>}
        </div>
        <a
          href="/"
          className="block w-full text-center bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
} 