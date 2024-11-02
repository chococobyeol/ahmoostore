import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentKey, orderId, amount } = body;

    // 토스페이먼츠 결제 승인 요청
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 500 });
  }
} 