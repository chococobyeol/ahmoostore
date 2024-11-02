'use client';

import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/'); // 홈페이지로 이동
  };

  return (
    <div>
      <h1>결제가 완료되었습니다</h1>
      <button onClick={handleComplete}>완료</button>
    </div>
  );
} 