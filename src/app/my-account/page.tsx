'use client';

import React, { useEffect, useState } from 'react';
import { getUserOrders } from '@/utils/wordpress';

interface OrderItem {
  name: string;
  quantity: number;
  total: string;
}

interface Order {
  id: number;
  status: string;
  total: string;
  date_created: string;
  payment_method: string;
  items: OrderItem[];
}

export default function MyAccount() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        console.log('주문 데이터 가져오기 시작...');
        const data = await getUserOrders();
        console.log('받은 주문 데이터:', data);
        setOrders(data);
      } catch (err) {
        console.error('주문 데이터 가져오기 실패:', err);
        setError(err instanceof Error ? err.message : '주문을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">내 계정</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">계정 정보</h2>
        {/* 계정 정보 표시 */}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">주문 내역</h2>
        {loading && <div>주문 내역을 불러오는 중...</div>}
        {error && <div className="text-red-500">에러: {error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div>주문 내역이 없습니다.</div>
        )}
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded-lg shadow">
              <div className="flex justify-between mb-2">
                <span className="font-medium">주문번호: {order.id}</span>
                <span className="text-blue-600">{order.status}</span>
              </div>
              <div className="mb-2 text-gray-600">
                <span>주문일: {new Date(order.date_created).toLocaleDateString()}</span>
              </div>
              <div className="mb-2 text-gray-600">
                <span>결제방법: {order.payment_method}</span>
              </div>
              <div className="border-t pt-2">
                <h3 className="font-medium mb-2">주문 상품</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-gray-700">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{parseInt(item.total).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 text-right">
                <span className="font-bold">
                  총 결제금액: {parseInt(order.total).toLocaleString()}원
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
