import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, Typography, Paper, Button, 
  CircularProgress, Alert, AlertTitle,
  TextField, Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import { uploadAudioFile } from '../../utils/api';

export default function UploadNew() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }
    
    // 파일 확장자 체크
    const allowedExtensions = ['.wav', '.mp3', '.m4a', '.ogg'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      setError('지원하지 않는 파일 형식입니다. (지원: wav, mp3, m4a, ogg)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await uploadAudioFile(file);
      setSuccess({
        filename: result.filename,
        message: result.message,
        s3_url: result.s3_url
      });
      setFile(null);
      // 3초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push('/uploads');
      }, 3000);
    } catch (err) {
      console.error('Upload failed', err);
      setError(err.response?.data?.detail || '업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        음성 파일 업로드
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>오류</AlertTitle>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>업로드 성공!</AlertTitle>
            <p><strong>파일명:</strong> {success.filename}</p>
            <p><strong>메시지:</strong> {success.message}</p>
            <p>3초 후 목록 페이지로 이동합니다...</p>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: file ? '#f0f7ff' : '#f9f9f9',
                transition: 'all 0.3s',
              }}
            >
              <input
                accept=".wav,.mp3,.m4a,.ogg"
                style={{ display: 'none' }}
                id="audio-file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="audio-file-upload">
                {file ? (
                  <Box>
                    <AudioFileIcon fontSize="large" color="primary" />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <CloudUploadIcon fontSize="large" color="action" />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      클릭하여 파일 선택 또는 드래그 앤 드롭
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      지원 파일: WAV, MP3, M4A, OGG (최대 50MB)
                    </Typography>
                  </Box>
                )}
              </label>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/uploads')}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                disabled={loading || !file}
              >
                {loading ? '업로드 중...' : '업로드'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
} 