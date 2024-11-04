import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{ src: string }>;
}

export default function ProductCard({
  id,
  name,
  price,
  regular_price,
  sale_price,
  images,
}: ProductCardProps) {
  const hasDiscount = sale_price !== '' && sale_price !== '0';
  
  return (
    <Link href={`/products/${id}`} className="group">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
        <Image
          src={images[0]?.src || '/placeholder.jpg'}
          alt={name}
          width={500}
          height={500}
          className="h-full w-full object-cover object-center group-hover:opacity-75"
        />
      </div>
      <h3 className="mt-4 text-sm text-gray-700">{name}</h3>
      <div className="mt-1">
        <div className="flex gap-2 items-center">
          {hasDiscount ? (
            <>
              <span className="text-lg font-medium text-red-600">₩{sale_price}</span>
              <span className="text-sm text-gray-400 line-through">₩{regular_price}</span>
            </>
          ) : (
            <span className="text-lg font-medium text-gray-900">₩{regular_price}</span>
          )}
        </div>
      </div>
    </Link>
  );
} 