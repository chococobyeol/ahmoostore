'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  
  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    async function confirmPayment() {
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
          }),
        });

        if (!response.ok) {
          throw new Error('결제 승인 실패');
        }

        const data = await response.json();
        console.log('Payment confirmed:', data);
        
        alert('결제가 완료되었습니다!');
        router.push('/');
      } catch (error) {
        console.error('Payment confirmation error:', error);
        alert('결제 확인 중 오류가 발생했습니다.');
        router.push('/checkout');
      } finally {
        setIsProcessing(false);
      }
    }

    if (paymentKey && orderId && amount) {
      confirmPayment();
    } else {
      setIsProcessing(false);
      alert('잘못된 접근입니다.');
      router.push('/');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">결제 처리 중...</h1>
        {isProcessing ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        ) : (
          <p>잠시만 기다려주세요...</p>
        )}
      </div>
    </div>
  );
} 