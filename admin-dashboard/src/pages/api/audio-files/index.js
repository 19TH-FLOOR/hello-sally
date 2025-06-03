import axios from 'axios';
import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // formidable을 사용하기 위해 비활성화
  },
};

const API_BASE_URL = process.env.API_URL || 'http://api-server:8000';

export default async function handler(req, res) {
  console.log(`=== API Route 호출 ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`API_BASE_URL: ${API_BASE_URL}`);
  
  try {
    if (req.method === 'GET') {
      console.log('GET 요청 처리 시작');
      // 파일 목록 조회
      const response = await axios.get(`${API_BASE_URL}/audio-files`, {
        timeout: 30000,
      });
      console.log('GET 요청 성공');
      res.status(200).json(response.data);
    } else if (req.method === 'POST') {
      console.log('POST 요청 처리 시작');
      
      // 파일 업로드
      const form = formidable({
        maxFileSize: 100 * 1024 * 1024, // 100MB
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      console.log('formidable 파싱 시작');
      const [fields, files] = await form.parse(req);
      console.log('formidable 파싱 완료', { fields, files });

      const file = files.file?.[0];
      console.log('파일 정보:', file);

      if (!file) {
        console.log('파일이 없음');
        return res.status(400).json({ error: '파일이 없습니다.' });
      }

      // FormData 생성
      console.log('FormData 생성 시작');
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.filepath), {
        filename: file.originalFilename,
        contentType: file.mimetype,
      });

      console.log('FastAPI로 전송 시작 - POST /audio-files (일관성 있게 통일)');
      // FastAPI로 전송 - 일관성 있게 슬래시 없음
      const response = await axios.post(`${API_BASE_URL}/audio-files`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5분
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
      });

      console.log('FastAPI 응답 받음', response.status);

      // 임시 파일 삭제
      fs.unlinkSync(file.filepath);
      console.log('임시 파일 삭제 완료');

      res.status(200).json(response.data);
    } else {
      console.log(`지원하지 않는 메서드: ${req.method}`);
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('=== API 프록시 에러 ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error response:', error.response?.data);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }
  }
} 