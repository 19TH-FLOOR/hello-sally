import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: '/api', // Next.js의 rewrites를 통해 프록시됨
  headers: {
    'Content-Type': 'application/json',
  },
});

// 파일 목록 가져오기
export const getAudioFiles = async () => {
  console.log('API 호출: 파일 목록 가져오기');
  const response = await api.get('/audio-files');
  console.log('API 응답:', response);
  return response.data;
};

// 파일 업로드
export const uploadAudioFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/audio-files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// 파일 다운로드 URL 가져오기 (프록시 사용)
export const getDownloadUrl = (fileId) => {
  // 다운로드는 브라우저에서 직접 URL을 열기 때문에 전체 경로가 필요함
  // Next.js 서버를 통해 프록시되도록 /api 경로 사용
  return `/api/audio-files/${fileId}/download`;
};

// 파일 다운로드 함수 (Ajax 요청 후 Blob으로 처리)
export const downloadFile = async (fileId, filename) => {
  try {
    // 직접 응답을 받아서 처리하는 방식으로 변경
    const response = await api.get(`/audio-files/${fileId}/download`, {
      responseType: 'blob',
    });
    
    // Blob URL 생성 및 다운로드
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // 파일명 지정
    document.body.appendChild(link);
    link.click();
    
    // 정리
    link.remove();
    window.URL.revokeObjectURL(url);
    
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