import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, orderName } = body;

    // 토스페이먼츠 결제 요청
    const response = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        orderId,
        orderName,
        successUrl: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/payments/success`,
        failUrl: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/payments/fail`,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
} 