import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://api-server:8000';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'POST') {
      // STT 처리 시작
      const response = await axios.post(`${API_BASE_URL}/audio-files/${id}/transcribe`, {}, {
        timeout: 30000,
      });
      
      res.status(200).json(response.data);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('STT API 프록시 에러:', error.message);
    
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