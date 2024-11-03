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
      }
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || `로그인 실패: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    } else {
      throw new Error('요청 설정 중 오류가 발생했습니다.');
    }
  }
}; 