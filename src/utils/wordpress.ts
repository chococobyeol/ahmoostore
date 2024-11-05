import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

if (!baseURL) {
  console.error('WordPress API URL이 설정되지 않았습니다.');
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const registerUser = async (userData: RegisterData) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${baseURL}/wp-json/custom/v1/register`,
      data: userData,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || `서버 오류: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    } else {
      throw new Error('요청 설정 중 오류가 발생했습니다.');
    }
  }
};

interface LoginData {
  username: string;
  password: string;
}

interface LoginResponse {
  status: string;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string;
  };
}

export const loginUser = async (credentials: LoginData): Promise<LoginResponse> => {
  try {
    const response = await axios({
      method: 'post',
      url: `${baseURL}/wp-json/custom/v1/login`,
      data: credentials,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true
    });
    
    const sessionCheck = await fetch(
      `${baseURL}/wp-json/wp/v2/users/me`,
      {
        credentials: 'include'
      }
    );
    
    console.log('로그인 후 세션 상태:', sessionCheck.status);
    
    return response.data;
  } catch (error: any) {
    console.error('로그인 오류:', error.response || error);
    throw new Error(error.response?.data?.message || '로그인에 실패했습니다.');
  }
};

// WordPress nonce를 가져오는 함수 추가
async function getNonce(): Promise<string> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json`,
      {
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch nonce');
    }

    const data = await response.json();
    return data.nonce || '';
  } catch (error) {
    console.error('Nonce 가져오기 실패:', error);
    return '';
  }
}

interface OrderItem {
  name: string;
  quantity: number;
  total: number;
  product_id: number;
  image: string | null;
}

interface Order {
  id: number;
  status: string;
  status_name: string;
  total: number;
  currency: string;
  date_created: string;
  payment_method: string;
  items: OrderItem[];
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
}

// URL 확인 로직 추가
const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const WOOCOMMERCE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL;

if (!WORDPRESS_URL || !WOOCOMMERCE_URL) {
  console.error('필수 환경 변수가 설정되지 않았습니다:', {
    WORDPRESS_URL,
    WOOCOMMERCE_URL
  });
}

export async function fetchUserOrders(): Promise<OrdersResponse> {
  try {
    // WooCommerce REST API 인증 정보 추가
    const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY;
    const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('WooCommerce API 키가 설정되지 않았습니다.');
    }

    // Basic Auth 헤더 생성
    const authString = btoa(`${consumerKey}:${consumerSecret}`);

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/custom/v1/my-orders`,
      {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`,
          'Origin': process.env.NEXTAUTH_URL || 'https://ahmoostore.onrender.com',
        },
      }
    );

    console.log('주문 조회 응답:', response.status);
    console.log('응답 헤더:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      
      if (response.status === 401) {
        window.location.href = '/login'; // 로그인 페이지로 리다이렉트
        throw new Error('로그인이 필요합니다.');
      }
      
      throw new Error(`주문 조회 실패: ${errorText}`);
    }

    const data = await response.json();
    console.log('받은 데이터:', data);
    
    return data;
  } catch (error) {
    console.error('주문 조회 중 오류 발생:', error);
    throw error;
  }
}

// 에러 처리를 위한 커스텀 에러 클래스
export class OrderError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OrderError';
  }
}