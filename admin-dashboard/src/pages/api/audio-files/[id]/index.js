import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://api-server:8000';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'DELETE') {
      // 파일 삭제
      const response = await axios.delete(`${API_BASE_URL}/audio-files/${id}`, {
        timeout: 30000,
      });
      
      res.status(204).end(); // 204 No Content
    } else {
      res.setHeader('Allow', ['DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API 프록시 에러:', error.message);
    
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