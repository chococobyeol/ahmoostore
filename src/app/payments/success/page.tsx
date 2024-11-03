'use client';

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [updateStatus, setUpdateStatus] = useState('pending')

  useEffect(() => {
    if (orderId) {
      fetch('http://ahmoostore.local/wp-json/custom/v1/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId
        })
      })
      .then(res => {
        if (!res.ok) {
          console.error('API 응답 에러:', res.status, res.statusText);
          throw new Error('API 요청 실패');
        }
        return res.json();
      })
      .then(data => {
        console.log('API 응답:', data);
        if (data.success) {
          setUpdateStatus('success');
        } else {
          setUpdateStatus('error');
        }
      })
      .catch(error => {
        console.error('주문 상태 업데이트 실패:', error);
        setUpdateStatus('error');
      });
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">결제 완료</h1>
        <p className="text-center text-gray-600 mb-4">
          결제가 성공적으로 완료되었습니다.
        </p>
        <p className="text-center text-sm text-gray-500">
          주문번호: {orderId}
        </p>
        {updateStatus === 'error' && (
          <p className="text-center text-red-500 mt-4">
            주문 상태 업데이트 중 문제가 발생했습니다.
          </p>
        )}
      </div>
    </div>
  )
} 