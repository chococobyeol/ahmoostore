import { getProduct, getProducts } from '@/utils/woocommerce';
import { ProductDetail } from './ProductDetail';

interface Product {
  id: number;
  name: string;
  price: string;
  images: { src: string }[];
  description: string;
}

// 정적 경로 생성
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product: Product) => ({
    id: product.id.toString(),
  }));
}

// 페이지 컴포넌트
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(Number(params.id));
  return <ProductDetail product={product} />;
} 