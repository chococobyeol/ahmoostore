'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [updateStatus, setUpdateStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const updateOrderStatus = async () => {
      if (!orderId) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/wp-json/custom/v1/update-order-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('주문 상태 업데이트 실패:', errorData);
          throw new Error(`주문 상태 업데이트 실패: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setUpdateStatus('success');
        } else {
          throw new Error('주문 상태 업데이트 실패');
        }
      } catch (error) {
        console.error('주문 상태 업데이트 중 오류:', error);
        setUpdateStatus('error');
      }
    };

    updateOrderStatus();
  }, [orderId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">결제 완료</h1>
        {updateStatus === 'pending' && (
          <p className="text-gray-600 mb-4">결제가 성공적으로 완료되었습니다.</p>
        )}
        {updateStatus === 'success' && (
          <>
            <p className="text-gray-600 mb-4">결제가 성공적으로 완료되었습니다.</p>
            <p className="text-gray-500">주문번호: {orderId}</p>
          </>
        )}
        {updateStatus === 'error' && (
          <p className="text-red-500 mb-4">주문 상태 업데이트 중 문제가 발생했습니다.</p>
        )}
        <div className="mt-8">
          <Link 
            href="/my-account" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            주문 내역 확인
          </Link>
        </div>
      </div>
    </div>
  );
} 