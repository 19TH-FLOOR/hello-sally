import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://api-server:8000';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      console.log(`파일 다운로드 요청: ID ${id}`);
      
      // 먼저 파일 정보를 가져와서 파일명 확인
      let filename = `file_${id}`;
      try {
        const filesResponse = await axios.get(`${API_BASE_URL}/audio-files`, {
          timeout: 10000,
        });
        const file = filesResponse.data.find(f => f.id === parseInt(id));
        if (file && file.filename) {
          filename = file.filename;
          console.log(`실제 파일명: ${filename}`);
        }
      } catch (error) {
        console.log('파일 정보 조회 실패, 기본 파일명 사용');
      }
      
      // FastAPI에서 presigned URL을 받아옴
      const response = await axios.get(`${API_BASE_URL}/audio-files/${id}/download`, {
        timeout: 30000,
        maxRedirects: 0, // 리다이렉트를 자동으로 따라가지 않음
        validateStatus: function (status) {
          return status >= 200 && status < 400; // 리다이렉트 상태 코드도 허용
        }
      });

      if (response.status === 302 || response.status === 307) {
        // 리다이렉트 URL (presigned URL)을 받아옴
        const presignedUrl = response.headers.location;
        console.log('Presigned URL 받음');

        // S3에서 파일을 직접 다운로드
        const fileResponse = await axios.get(presignedUrl, {
          responseType: 'stream',
          timeout: 300000, // 5분
        });

        // 강제 다운로드를 위한 헤더 설정
        res.setHeader('Content-Type', 'application/octet-stream'); // 강제로 바이너리로 처리
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');
        
        // Content-Length 설정 (있는 경우)
        if (fileResponse.headers['content-length']) {
          res.setHeader('Content-Length', fileResponse.headers['content-length']);
        }
        
        console.log(`파일 스트리밍 시작: ${filename}`);
        
        // 파일 스트리밍
        fileResponse.data.pipe(res);
        
        fileResponse.data.on('end', () => {
          console.log('파일 스트리밍 완료');
        });

        fileResponse.data.on('error', (error) => {
          console.error('스트리밍 에러:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'File streaming failed' });
          }
        });

      } else {
        // 직접 파일 데이터가 온 경우 (혹시 모를 경우)
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');
        res.send(response.data);
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('다운로드 API 프록시 에러:', error.message);
    
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