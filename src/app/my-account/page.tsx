'use client';

import { useEffect, useState } from 'react';
import { fetchUserOrders } from '@/utils/wordpress';

// 주문 아이템 타입 정의
interface OrderItem {
  name: string;
  quantity: number;
  total: number;
  product_id: number;
  image: string | null;
}

// 주문 타입 정의
interface Order {
  id: number;
  status: string;
  status_name: string;
  total: number;
  currency: string;
  date_created: string;
  payment_method: string;
  items: OrderItem[];
}

export default function MyAccount() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const response = await fetchUserOrders();
        console.log('받은 주문 데이터:', response);
        setOrders(response.orders || []);
      } catch (err: unknown) {
        console.error('주문 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) return <div>주문 내역을 불러오는 중...</div>;
  if (error) return <div>오류가 발생했습니다: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">내 주문 내역</h1>
      {orders.length === 0 ? (
        <p>주문 내역이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>주문번호: {order.id}</span>
                <span>상태: {order.status_name}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>주문일시: {new Date(order.date_created).toLocaleString()}</p>
                <p>결제방법: {order.payment_method}</p>
                <p>총 금액: {order.total.toLocaleString()}원</p>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold">주문 상품</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center mt-2">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover mr-2" />
                    )}
                    <div>
                      <p>{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity}개 × {(item.total / item.quantity).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
