'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-center mb-8">주문이 완료되었습니다!</h1>
        <div className="text-center mb-8">
          <p className="text-lg mb-2">주문번호: {orderId}</p>
          <p className="text-gray-600">
            결제가 성공적으로 처리되었습니다. 주문 내역은 이메일로 발송됩니다.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
} 