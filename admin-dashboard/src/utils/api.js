import axios from 'axios';

// API 기본 설정 - 런타임 환경변수 사용
const getBaseURL = () => {
  // 디버깅을 위한 환경변수 로깅
  console.log('🔍 API 환경변수 체크:', {
    isServer: typeof window === 'undefined',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    API_URL: process.env.API_URL,
    NODE_ENV: process.env.NODE_ENV
  });
  
  // 브라우저 환경에서는 NEXT_PUBLIC_API_URL 사용
  if (typeof window !== 'undefined') {
    const url = process.env.NEXT_PUBLIC_API_URL || '/api';
    console.log('🌐 브라우저 환경 - 사용할 API URL:', url);
    return url;
  }
  // 서버 환경에서는 API_URL 사용
  const url = process.env.API_URL || '/api';
  console.log('🖥️ 서버 환경 - 사용할 API URL:', url);
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  // 연결 안정성을 위한 설정 추가
  timeout: 30000, // 30초 타임아웃
  retry: 3, // 재시도 횟수
  retryDelay: 1000, // 재시도 간격 (1초)
});

// 요청 인터셉터 - 재시도 로직 추가
api.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 재시도 로직
api.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // 재시도 로직
    if (!config || !config.retry) {
      return Promise.reject(error);
    }
    
    // ECONNRESET, 타임아웃, 네트워크 에러 등에 대해 재시도
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.message.includes('Network Error') ||
      (error.response && error.response.status >= 500)
    ) {
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < config.retry) {
        config.__retryCount += 1;
        console.log(`API 재시도 ${config.__retryCount}/${config.retry}: ${config.url}`);
        
        // 재시도 전 지연
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
        
        return api(config);
      }
    }
    
    console.error('API 에러:', error.message, error.response?.data);
    return Promise.reject(error);
  }
);

// 파일 목록 가져오기
export const getAudioFiles = async () => {
  console.log('API 호출: 파일 목록 가져오기');
  const response = await api.get('/audio-files');
  console.log('API 응답:', response);
  return response.data;
};

// 파일 업로드 - Next.js API Routes 사용
export const uploadAudioFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/audio-files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5분 타임아웃
  });
  
  return response.data;
};

// 파일 다운로드 URL 가져오기 (프록시 사용)
export const getDownloadUrl = (fileId) => {
  // 다운로드는 브라우저에서 직접 URL을 열기 때문에 전체 경로가 필요함
  // Next.js 서버를 통해 프록시되도록 /api 경로 사용
  return `/api/audio-files/${fileId}/download`;
};

// 파일 다운로드 함수 - 새창에서 열기 방식
export const downloadFile = async (fileId, filename) => {
  try {
    console.log(`파일 다운로드 시작: ID ${fileId}, 파일명 ${filename}`);
    
    // 새창에서 다운로드 URL 열기
    const downloadUrl = `/api/audio-files/${fileId}/download`;
    window.open(downloadUrl, '_blank');
    
    console.log('다운로드 요청 완료');
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

// 파일 삭제하기
export const deleteAudioFile = async (fileId) => {
  const response = await api.delete(`/audio-files/${fileId}`);
  return response.data;
};

// STT 처리 시작
export const startTranscription = async (fileId) => {
  const response = await api.post(`/audio-files/${fileId}/transcribe`);
  return response.data;
};

// STT 결과 조회
export const getTranscript = async (fileId) => {
  const response = await api.get(`/audio-files/${fileId}/transcript`);
  return response.data;
}; 