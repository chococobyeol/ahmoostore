'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

async function updateOrderStatus(orderId: string) {
  try {
    console.log('주문 상태 업데이트 시도:', orderId);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/custom/v1/update-order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('주문 상태 업데이트 실패:', errorData);
      throw new Error(errorData.message || '주문 상태 업데이트에 실패했습니다');
    }

    const data = await response.json();
    console.log('주문 상태 업데이트 성공:', data);
    return data;
  } catch (error) {
    console.error('주문 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const [updateStatus, setUpdateStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    if (orderId) {
      console.log('주문 ID 확인됨:', orderId);
      updateOrderStatus(orderId)
        .then(() => {
          console.log('주문 상태 업데이트 성공');
          setUpdateStatus('success');
        })
        .catch((error) => {
          console.error('주문 상태 업데이트 실패:', error);
          setUpdateStatus('error');
        });
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-4">결제 성공</h1>
        <div className="text-gray-600 mb-6">
          <p>결제가 성공적으로 완료되었습니다.</p>
          {orderId && <p className="mt-2">주문번호: {orderId}</p>}
          {amount && <p className="mt-2">결제금액: {parseInt(amount).toLocaleString()}원</p>}
          <p className="mt-2">
            주문 상태: {
              updateStatus === 'pending' ? '처리 중...' :
              updateStatus === 'success' ? '주문 처리 완료' :
              '주문 처리 중 오류가 발생했습니다'
            }
          </p>
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