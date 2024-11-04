import { getProducts } from '@/utils/woocommerce';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  regular_price: string;
  sale_price: string;
  price: string;
  images: { src: string; alt: string }[];
  description: string;
}

export const revalidate = 0;

export default async function ProductsPage() {
  try {
    const products = await getProducts();
    
    if (!products) {
      return <div>상품을 불러올 수 없습니다.</div>;
    }

    return (
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold my-8">상품 목록</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: Product) => (
            <div key={product.id} className="product-card border rounded-lg p-4 shadow-md">
              <Link href={`/products/${product.id}`}>
                <div className="relative w-full h-64 mb-4">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0].src}
                      alt={product.images[0].alt || product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span>이미지 없음</span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <div className="space-y-1">
                  {product.sale_price ? (
                    <>
                      <p className="text-sm line-through text-gray-500">
                        {new Intl.NumberFormat('ko-KR', { 
                          style: 'currency', 
                          currency: 'KRW' 
                        }).format(Number(product.regular_price))}
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {new Intl.NumberFormat('ko-KR', { 
                          style: 'currency', 
                          currency: 'KRW' 
                        }).format(Number(product.sale_price))}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('ko-KR', { 
                        style: 'currency', 
                        currency: 'KRW' 
                      }).format(Number(product.regular_price))}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ProductsPage 렌더링 중 오류:', error);
    return <div>상품을 불러오는 중 오류가 발생했습니다.</div>;
  }
} 