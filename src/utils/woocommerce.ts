import axios from 'axios';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const baseURL = process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL;

// 상품 조회용 키 (서버 사이드)
const productKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const productSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

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

export const createOrder = async (orderData: any): Promise<WooCommerceOrder> => {
  const endpoint = '/wp-json/wc/v3/orders';
  const fullUrl = `${baseURL}${endpoint}`;
  
  if (!orderKey || !orderSecret) {
    console.error('주문 API 키가 설정되지 않았습니다:', { orderKey, orderSecret });
    throw new Error('주문 API 키가 설정되지 않았습니다.');
  }

  const oauthHeader = getOAuthHeader(fullUrl, 'POST', orderKey!, orderSecret!);
  
  try {
    console.log('주문 생성 요청 정보:', {
      url: fullUrl,
      baseURL,
      endpoint,
      orderKey,
      orderSecret,
      data: orderData,
      headers: {
        ...oauthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const response = await axios({
      method: 'POST',
      url: fullUrl,
      data: orderData,
      headers: {
        ...oauthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });

    console.log('주문 생성 응답:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('주문 생성 상세 오류:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      request: error.request,
      config: error.config,
      stack: error.stack
    });
    throw error;
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
  return get(endpoint);
};

export const getProduct = async (id: number) => {
  const endpoint = `/wp-json/wc/v3/products/${id}`;
  return get(endpoint);
};