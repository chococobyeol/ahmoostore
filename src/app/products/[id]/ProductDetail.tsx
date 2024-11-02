'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: string;
  images: { src: string }[];
  description: string;
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
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
        <div className="relative h-96">
          {product.images[0] && (
            <Image
              src={product.images[0].src}
              alt={product.name}
              fill
              className="object-contain"
            />
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div 
            className="prose prose-lg mb-6"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <div className="mb-6">
            <span className="text-2xl font-bold">
              {parseInt(product.price).toLocaleString()}원
            </span>
          </div>
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