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
  const { id } = await params; // 비동기적으로 params를 처리
  if (!id) {
    return <div>유효하지 않은 상품 ID입니다.</div>;
  }
  
  const productId = parseInt(id, 10);
  const product = await getProduct(productId);

  if (!product) {
    return <div>상품을 찾을 수 없습니다.</div>;
  }

  return <ProductDetail product={product} />;
} 