import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

// Next.js body parser 비활성화 (파일 업로드 처리를 위해)
export const config = {
  api: {
    bodyParser: false, // formidable을 사용하기 위해 비활성화
  },
};

// 범용 API 프록시 - 모든 /api/* 요청을 백엔드로 전달
export default async function handler(req, res) {
  const { proxy } = req.query;
  
  // proxy는 배열이므로 경로로 조합
  const apiPath = Array.isArray(proxy) ? proxy.join('/') : proxy;
  
  // 백엔드 API 서버 URL (환경변수에서 가져옴)
  const API_BASE_URL = process.env.API_URL || 'http://api-server:8000';
  const targetUrl = `${API_BASE_URL}/${apiPath}`;
  
  console.log(`🔄 API 프록시: ${req.method} /${apiPath}`);
  
  let uploadedFiles = []; // 업로드된 파일들을 추적하기 위한 변수
  
  try {
    let axiosConfig = {
      method: req.method.toLowerCase(),
      url: targetUrl,
      headers: {},
      timeout: 30000, // 기본 30초
    };
    
    // Content-Type에 따른 body 처리
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // 파일 업로드 처리
      console.log('📁 파일 업로드 처리 시작');
      
      const form = formidable({
        maxFileSize: 100 * 1024 * 1024, // 100MB
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      const [fields, files] = await form.parse(req);
      console.log('📁 Formidable 파싱 완료');
      
      // 업로드된 파일들을 추적
      uploadedFiles = Object.values(files).flat();

      // FormData 생성
      const formData = new FormData();
      
      // 필드 추가
      Object.keys(fields).forEach(key => {
        const value = fields[key];
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      });
      
      // 파일 추가
      Object.keys(files).forEach(key => {
        const fileArray = files[key];
        if (Array.isArray(fileArray)) {
          fileArray.forEach(file => {
            formData.append(key, fs.createReadStream(file.filepath), {
              filename: file.originalFilename,
              contentType: file.mimetype,
            });
          });
        } else {
          const file = fileArray;
          formData.append(key, fs.createReadStream(file.filepath), {
            filename: file.originalFilename,
            contentType: file.mimetype,
          });
        }
      });
      
      axiosConfig.data = formData;
      axiosConfig.headers = {
        ...formData.getHeaders(),
      };
      
      // 파일 업로드용 타임아웃과 크기 제한 증가
      axiosConfig.timeout = 300000; // 5분
      axiosConfig.maxContentLength = 100 * 1024 * 1024; // 100MB
      axiosConfig.maxBodyLength = 100 * 1024 * 1024; // 100MB
      
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      // JSON 데이터 처리
      console.log('📄 JSON 데이터 처리');
      
      // body를 수동으로 읽기
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString();
      
      try {
        axiosConfig.data = JSON.parse(body);
      } catch {
        axiosConfig.data = body;
      }
      
      axiosConfig.headers = {
        'Content-Type': contentType || 'application/json',
      };
    }
    
    // 기타 헤더 복사 (불필요한 헤더 제외)
    Object.keys(req.headers).forEach(key => {
      if (!['host', 'connection', 'content-length', 'content-type', 'transfer-encoding'].includes(key.toLowerCase())) {
        axiosConfig.headers[key] = req.headers[key];
      }
    });
    
    // 쿼리 파라미터 처리
    const params = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'proxy') { // proxy 파라미터는 제외
        const value = req.query[key];
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });
    
    if (params.toString()) {
      axiosConfig.params = params;
    }
    
    console.log(`🚀 요청 전송: ${axiosConfig.method.toUpperCase()} ${targetUrl}`);
    
    // 백엔드로 요청 전달
    const response = await axios(axiosConfig);
    
    console.log(`✅ 응답 받음: ${response.status}`);
    
    // 임시 파일 정리 (파일 업로드인 경우)
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        try {
          fs.unlinkSync(file.filepath);
          console.log(`🗑️ 임시 파일 삭제: ${file.filepath}`);
        } catch (err) {
          console.warn('임시 파일 삭제 실패:', err.message);
        }
      });
    }
    
    // 응답 헤더 복사 (CORS 관련 헤더 제외)
    Object.keys(response.headers).forEach(key => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, response.headers[key]);
      }
    });
    
    // 응답 상태 코드 설정
    res.status(response.status);
    
    // 응답 데이터 전송 (204는 body 없음)
    if (response.status === 204) {
      res.end();
    } else {
      res.json(response.data);
    }
    
  } catch (error) {
    console.error('🚨 API 프록시 에러:', error);
    
    // 임시 파일 정리 (에러 발생 시에도)
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        try {
          fs.unlinkSync(file.filepath);
          console.log(`🗑️ 에러 시 임시 파일 삭제: ${file.filepath}`);
        } catch (err) {
          console.warn('임시 파일 삭제 실패:', err.message);
        }
      });
    }
    
    if (error.response) {
      // 백엔드에서 온 에러 응답
      res.status(error.response.status).json(error.response.data);
    } else {
      // 네트워크 또는 기타 에러
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  }
} 