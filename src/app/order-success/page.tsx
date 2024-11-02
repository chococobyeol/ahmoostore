'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  total: string;
  date: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    total: string;
  }>;
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  if (!orderDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-8">
          주문이 완료되었습니다!
        </h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">주문 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>주문번호:</div>
            <div>{orderDetails.id}</div>
            <div>주문일시:</div>
            <div>{orderDetails.date}</div>
            <div>총 결제금액:</div>
            <div>{orderDetails.total}</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">주문 상품</h2>
          {orderDetails.items.map((item, index) => (
            <div key={index} className="flex justify-between py-2 border-b">
              <div>{item.name} × {item.quantity}</div>
              <div>{item.total}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
} 