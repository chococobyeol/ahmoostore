import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold">
              아무스토어
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/signup" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              회원가입
            </Link>
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 