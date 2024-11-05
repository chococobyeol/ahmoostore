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
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error: any) {
    console.error('로그인 오류:', error.response || error);
    if (error.response) {
      throw new Error(error.response.data?.message || `로그인 실패: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    } else {
      throw new Error('요청 설정 중 오류가 발생했습니다.');
    }
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

export async function getUserOrders() {
  try {
    console.log('주문 조회 시작...');
    const apiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/custom/v1/my-orders`;
    console.log('요청 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-WP-Nonce': await getNonce()
      }
    });

    console.log('응답 상태:', response.status);
    const responseText = await response.text();
    console.log('원본 응답:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      throw new Error('서버 응답을 파싱할 수 없습니다.');
    }

    console.log('파싱된 응답 데이터:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || '주문 정보를 가져오는데 실패했습니다.');
    }

    if (!responseData.success || !Array.isArray(responseData.orders)) {
      console.error('잘못된 응답 형식:', responseData);
      throw new Error('잘못된 응답 형식입니다.');
    }

    return responseData.orders;
  } catch (error: any) {
    console.error('주문 조회 오류 상세:', error);
    throw new Error('주문 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
  }
}

// 에러 처리를 위한 커스텀 에러 클래스
export class OrderError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OrderError';
  }
}