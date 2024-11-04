'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  regular_price: string;
  sale_price: string;
  price: string;
  images: { src: string; alt: string }[];
  description: string;
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert('상품이 장바구니에 추가되었습니다!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        href="/products" 
        className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
      >
        ← 목록으로 돌아가기
      </Link>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative h-96 md:h-[600px]">
          {product.images && product.images[0] ? (
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
              <span>이미지 없음</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="space-y-2">
            {product.sale_price ? (
              <>
                <p className="text-lg line-through text-gray-500">
                  {new Intl.NumberFormat('ko-KR', { 
                    style: 'currency', 
                    currency: 'KRW' 
                  }).format(Number(product.regular_price))}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('ko-KR', { 
                    style: 'currency', 
                    currency: 'KRW' 
                  }).format(Number(product.sale_price))}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('ko-KR', { 
                  style: 'currency', 
                  currency: 'KRW' 
                }).format(Number(product.regular_price))}
              </p>
            )}
          </div>
          
          <div className="prose max-w-none" 
               dangerouslySetInnerHTML={{ __html: product.description }} 
          />
          
          <div className="flex items-center gap-4 mb-6">
            <label htmlFor="quantity" className="font-medium">수량:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="border rounded px-3 py-2 w-20"
            />
          </div>
          <button 
            onClick={handleAddToCart}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            장바구니에 담기
          </button>
        </div>
      </div>
    </div>
  );
} 