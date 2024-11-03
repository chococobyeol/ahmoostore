'use client';

import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/'); // 홈페이지로 이동
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          결제가 완료되었습니다
        </h1>
        <button 
          onClick={handleComplete}
          className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  );
} 