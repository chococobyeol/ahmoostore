import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic'; // 동적 라우트 설정

export async function GET() {
  try {
    const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const orderKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY;
    const orderSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET;

    if (!wpApiUrl || !orderKey || !orderSecret) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const apiUrl = new URL('/wp-json/wc/v3/orders', wpApiUrl);
    apiUrl.searchParams.append('consumer_key', orderKey);
    apiUrl.searchParams.append('consumer_secret', orderSecret);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API Error:', errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    revalidatePath('/my-account');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in orders API route:', error);
    return NextResponse.json(
      { error: '주문 내역을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 