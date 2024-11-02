import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

if (!baseURL) {
  console.error('WordPress API URL이 설정되지 않았습니다.');
}

console.log('WordPress API URL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const registerUser = async (userData: RegisterData) => {
  try {
    const currentURL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    console.log('현재 사용중인 WordPress URL:', currentURL);
    
    const url = `${currentURL}/wp-json/custom/v1/register`;
    console.log('회원가입 요청 정보:', {
      url,
      data: userData,
    });
    
    const response = await axios({
      method: 'post',
      url,
      data: userData,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('회원가입 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('회원가입 실패:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      }
    });

    if (error.response) {
      throw new Error(error.response.data?.message || `서버 오류: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    } else {
      throw new Error('요청 설정 중 오류가 발생했습니다.');
    }
  }
}; 