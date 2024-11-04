import ProductDetail from './ProductDetail';
import { getProduct } from '@/utils/woocommerce';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(parseInt(params.id));

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
} 