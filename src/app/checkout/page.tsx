'use client';

import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/utils/woocommerce';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useAuth } from '@/context/AuthContext';

interface OrderForm {
  name: string;
  email: string;
  phone: string;
  isInternational: boolean;
  country: string;
  address: string;
  addressDetail: string;
  postcode: string;
  message: string;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<OrderForm>({
    name: '',
    email: user?.email || '',
    phone: '',
    isInternational: false,
    country: 'KR',
    address: '',
    addressDetail: '',
    postcode: '',
    message: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);

  const handleDomesticAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        setForm(prev => ({
          ...prev,
          address: data.address,
          postcode: data.zonecode
        }));
      }
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 장바구니 아이템을 WooCommerce 주문 형식으로 변환
      const lineItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,  // 장바구니의 수량 사용
        price: item.price.toString(),  // 상품 단가
        total: (parseFloat(item.price) * item.quantity).toString()  // 총액 계산
      }));

      const orderData = {
        payment_method: "tosspayments",
        payment_method_title: "토스페이먼츠",
        set_paid: false,
        billing: {
          first_name: form.name,
          email: form.email,
          phone: form.phone,
          address_1: `[${form.postcode}] ${form.address}`,
          address_2: form.addressDetail,
          country: form.isInternational ? form.country : 'KR',
        },
        shipping: {
          first_name: form.name,
          address_1: `[${form.postcode}] ${form.address}`,
          address_2: form.addressDetail,
          country: form.isInternational ? form.country : 'KR',
        },
        line_items: lineItems,  // 수정된 line_items 사용
        customer_note: form.message,
        meta_data: [
          {
            key: "is_paid",
            value: "false"
          }
        ]
      };

      console.log('주문 요청 데이터:', JSON.stringify(orderData, null, 2));
      
      try {
        const order = await createOrder(orderData);
        console.log('주문 생성 성공:', order);

        // 토스페이먼츠 결제 시작
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
        }

        const tossPayments = await loadTossPayments(clientKey);
        
        const orderId = `ORDER-${order.id}-${Date.now()}`;
        
        await tossPayments.requestPayment('카드', {
          amount: total,
          orderId: orderId,
          orderName: `아무스토어 주문 #${order.id}`,
          customerName: form.name || '고객',
          successUrl: `${window.location.origin}/payments/success?orderId=${order.id}`,
          failUrl: `${window.location.origin}/payments/fail`,
        });
      } catch (orderError: any) {
        console.error('주문 생성 실패 상세:', {
          message: orderError.message,
          response: orderError.response?.data,
          status: orderError.response?.status,
          config: orderError.config,
          stack: orderError.stack,
          headers: orderError.response?.headers,
          request: orderError.request,
          fullError: orderError
        });
        throw new Error(orderError.response?.data?.message || '주문 생성에 실패했습니다.');
      }

    } catch (error: any) {
      console.error('결제 처리 오류 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response,
        request: error.request,
        fullError: error
      });
      alert(error.message || '주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">결제하기</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* 주문 정보 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">주문 상품</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="text-gray-600">
                    {item.quantity}개 × {parseInt(item.price).toLocaleString()}원
                  </div>
                  <div className="font-semibold">
                    = {(parseInt(item.price) * item.quantity).toLocaleString()}원
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xl font-bold mb-8">
            총 결제금액: {total.toLocaleString()}원
          </div>
        </div>

        {/* 배송 정보 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              required
              className="w-full border rounded-lg px-4 py-2 bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">전화번호</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">배송지 유형</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isInternational"
                  checked={!form.isInternational}
                  onChange={() => setForm(prev => ({ ...prev, isInternational: false }))}
                  className="mr-2"
                />
                국내 배송
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isInternational"
                  checked={form.isInternational}
                  onChange={() => setForm(prev => ({ ...prev, isInternational: true }))}
                  className="mr-2"
                />
                해외 배송
              </label>
            </div>

            {form.isInternational ? (
              // 해외 배송 주소 입력 폼
              <>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">국가</label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="US">United States</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="GB">United Kingdom</option>
                    {/* 필요한 국가 추가 */}
                  </select>
                </div>
                <input
                  type="text"
                  name="postcode"
                  value={form.postcode}
                  onChange={handleChange}
                  placeholder="우편번호 (Postal Code)"
                  className="w-full border rounded-lg px-4 py-2 mb-2"
                />
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="주소 (Address)"
                  className="w-full border rounded-lg px-4 py-2 mb-2"
                />
              </>
            ) : (
              // 국내 배송 주소 입력 폼 (기존 코드)
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    name="postcode"
                    value={form.postcode}
                    readOnly
                    placeholder="우편번호"
                    className="w-32 border rounded-lg px-4 py-2 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleDomesticAddressSearch}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  readOnly
                  placeholder="기본주소"
                  className="w-full border rounded-lg px-4 py-2 bg-gray-50 mb-2"
                />
              </>
            )}
            
            <input
              type="text"
              name="addressDetail"
              value={form.addressDetail}
              onChange={handleChange}
              placeholder={form.isInternational ? "상세주소 (Address Detail)" : "상세주소를 입력하세요"}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">배송 메시지</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 h-24"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
            >
              {isLoading ? '처리중...' : '주문하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}