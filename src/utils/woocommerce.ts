import axios from 'axios';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const baseURL = process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL;

// 상품 조회용 키 (서버 사이드)
const productKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_KEY;
const productSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_SECRET;

// 주문 생성용 키 (클라이언트 사이드)
const orderKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY;
const orderSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET;

if (!baseURL) {
  throw new Error('WooCommerce API URL이 설정되지 않았습니다.');
}

const api = axios.create({
  baseURL,
});

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  [key: string]: any;
}

interface WooCommerceOrder {
  id: number;
  payment_url: string;
  status: string;
  [key: string]: any;
}

const getOAuthHeader = (url: string, method: string, key: string, secret: string) => {
  const oauth = new OAuth({
    consumer: {
      key: key,
      secret: secret
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
  });

  const requestData = {
    url: url,
    method: method
  };

  return oauth.toHeader(oauth.authorize(requestData));
};

export const get = async (endpoint: string, config: RequestConfig = {}, useOrderKeys = false) => {
  const key = useOrderKeys ? orderKey : productKey;
  const secret = useOrderKeys ? orderSecret : productSecret;

  if (!key || !secret) {
    console.error('사용 가능한 키:', { productKey, orderKey });
    throw new Error('WooCommerce API 키가 설정되지 않았습니다.');
  }

  try {
    const fullUrl = `${baseURL}${endpoint}`;
    const oauthHeader = getOAuthHeader(fullUrl, 'GET', key, secret);

    console.log('API 요청 정보:', {
      url: fullUrl,
      key,
      headers: oauthHeader
    });

    const response = await api.get(endpoint, {
      ...config,
      headers: {
        ...oauthHeader,
        'Content-Type': 'application/json',
        ...(config.headers || {})
      }
    });
    return response.data;
  } catch (error) {
    console.error('API 요청 오류:', error);
    throw error;
  }
};

export const createOrder = async (orderData: any) => {
  try {
    const formattedOrderData = {
      ...orderData,
      line_items: orderData.line_items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity || 1,
        price: item.price,
        total: (item.price * (item.quantity || 1)).toString()
      }))
    };

    console.log('주문 생성 요청 데이터:', formattedOrderData);

    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET}`)
      },
      body: JSON.stringify(formattedOrderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('주문 생성 실패 응답:', errorData);
      throw new Error(`주문 생성 실패: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('주문 생성 성공 응답:', data);
    return data;
  } catch (error) {
    console.error('주문 생성 상세 에러:', error);
    
    if (error instanceof Error) {
      throw new Error(`주문 생성 상세 오류: ${error.message}`);
    } else {
      throw new Error('주문 생성 중 알 수 없는 오류가 발생했습니다.');
    }
  }
};

export const getOrderStatus = async (orderId: number): Promise<string> => {
  const endpoint = `/wp-json/wc/v3/orders/${orderId}`;
  const fullUrl = `${baseURL}${endpoint}`;
  const oauthHeader = getOAuthHeader(fullUrl, 'GET', orderKey!, orderSecret!);

  try {
    const response = await api.get(endpoint, {
      headers: {
        ...oauthHeader,
        'Content-Type': 'application/json'
      }
    });
    return response.data.status;
  } catch (error) {
    console.error('주문 상태 조회 오류:', error);
    throw error;
  }
};

// 주문 상태 폴링 함수 추가
export const waitForOrderCompletion = async (orderId: number, maxAttempts = 30): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getOrderStatus(orderId);
    
    if (status === 'completed' || status === 'processing') {
      return true;
    }
    
    if (status === 'failed' || status === 'cancelled') {
      return false;
    }
    
    // 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
};

export const getProducts = async () => {
  const endpoint = '/wp-json/wc/v3/products';
  const params = {
    status: 'publish',
    per_page: '100',
    orderby: 'date',
    order: 'desc'
  };
  
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('WooCommerce Consumer 키가 설정되지 않았습니다.');
  }

  try {
    const fullUrl = `${baseURL}${endpoint}`;
    const queryString = new URLSearchParams(params).toString();
    const requestUrl = `${fullUrl}?${queryString}`;

    const response = await fetch(requestUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('상품 데이터를 가져오는데 실패했습니다.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('상품 조회 오류:', error);
    return []; // 에러 발생 시 빈 배열 반환
  }
};

export const getProduct = async (id: number) => {
  const endpoint = `/wp-json/wc/v3/products/${id}`;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('WooCommerce Consumer 키가 설정되지 않았습니다.');
  }

  try {
    const fullUrl = `${baseURL}${endpoint}`;
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('상품 데이터를 가져오는데 실패했습니다.');
    }

    return response.json();
  } catch (error) {
    console.error('상품 조회 오류:', error);
    return null; // 에러 발생 시 null 반환
  }
};

export function getWooCommerceKeys() {
  const productKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_KEY;
  const productSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_PRODUCT_SECRET;
  const orderKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_KEY;
  const orderSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_ORDER_SECRET;

  if (!productKey || !productSecret) {
    // 제품 API 키가 없을 경우 기본 consumer 키를 사용
    return {
      productKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
      productSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
      orderKey,
      orderSecret,
    };
  }

  return {
    productKey,
    productSecret,
    orderKey,
    orderSecret,
  };
}