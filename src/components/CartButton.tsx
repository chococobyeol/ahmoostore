'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag } from 'lucide-react';
import CartSidebar from './CartSidebar';

export default function CartButton() {
  const { items } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed right-4 top-4 z-50 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
      >
        <ShoppingBag className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
} 