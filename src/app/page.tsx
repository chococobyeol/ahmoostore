import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">아무 스토어</h1>
        <Link 
          href="/products" 
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          상품 목록 보기
        </Link>
      </div>
    </main>
  );
}
