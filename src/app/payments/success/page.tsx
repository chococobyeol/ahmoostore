'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

async function updateOrderStatus(orderId: string, searchParams: URLSearchParams) {
  try {
    console.log('주문 상태 업데이트 시도:', orderId);
    
    // Basic Auth 헤더 생성 (ORDER API 키 사용)
    const auth = btoa(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET}`);
    
    // WooCommerce REST API 직접 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        status: 'processing',
        payment_method: 'tosspayments',
        payment_method_title: '토스페이먼츠',
        set_paid: true
      })
    });

    if (!response.ok) {
      console.log('WooCommerce API 실패, 커스텀 엔드포인트 시도');
      // WooCommerce API 실패시 커스텀 엔드포인트로 시도
      const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/wp-json/custom/v1/update-order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_key: searchParams.get('paymentKey')
        }),
        credentials: 'include'
      });

      const fallbackData = await fallbackResponse.json();
      
      if (!fallbackResponse.ok) {
        console.error('커스텀 엔드포인트 실패:', fallbackData);
        throw new Error(fallbackData.message || '주문 상태 업데이트에 실패했습니다');
      }

      console.log('커스텀 엔드포인트 성공:', fallbackData);
      return fallbackData;
    }

    const data = await response.json();
    console.log('WooCommerce API 성공:', data);
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
      updateOrderStatus(orderId, searchParams)
        .then(() => {
          console.log('주문 상태 업데이트 성공');
          setUpdateStatus('success');
        })
        .catch((error) => {
          console.error('주문 상태 업데이트 실패:', error);
          setUpdateStatus('error');
        });
    }
  }, [orderId, searchParams]);

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