'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: number;
  order_key: string;
  date_created: string;
  total: string;
  status: string;
  line_items: OrderItem[];
}

function Spinner() {
  return (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  );
}

export default function MyAccountPage() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/my-account');
    } else {
      fetchOrders();
    }
  }, [isLoggedIn, router]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const credentials = btoa(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders?consumer_key=${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY}&consumer_secret=${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('주문 데이터를 불러오는데 실패했습니다:', error);
      setError(error instanceof Error ? error.message : '주문 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  // 날짜 포맷팅 함수 추가
  const formatDate = (dateString: string) => {
    // UTC 시간을 Date 객체로 변환
    const utcDate = new Date(dateString);
    
    // 한국 시간으로 변환 (UTC + 9시간)
    const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
    
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Seoul'  // 명시적으로 한국 시간대 지정
    }).format(kstDate);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">내 계정</h1>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">계정 정보</h2>
          <div className="space-y-2">
            <p className="flex items-center">
              <span className="font-medium w-24">이름:</span>
              <span>{user?.displayName || '미설정'}</span>
            </p>
            <p className="flex items-center">
              <span className="font-medium w-24">이메일:</span>
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">주문 내역</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 py-4">주문 내역이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        주문번호: {order.order_key}
                      </h3>
                      <p className="text-sm text-gray-500">
                        주문일시: {formatDate(order.date_created)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'completed' ? '배송완료' :
                       order.status === 'processing' ? '배송중' :
                       order.status === 'pending' ? '주문확인' : order.status}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <div className="space-y-2">
                      {order.line_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-700">{item.name}</span>
                          <div className="text-right">
                            <span className="text-gray-600">{item.quantity}개</span>
                            <span className="ml-4 text-gray-700">{item.subtotal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="font-medium text-gray-700">총 결제금액</span>
                      <span className="font-bold text-lg text-gray-900">{order.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
