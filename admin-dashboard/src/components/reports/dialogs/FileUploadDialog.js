import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

export default function FileUploadDialog({
  open,
  onClose,
  onUpload
}) {
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDisplayName, setUploadDisplayName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || 
          ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        setUploadFile(file);
        setUploadDisplayName('');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadDisplayName('');
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    try {
      await onUpload(uploadFile, uploadDisplayName);
      handleClose();
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setUploadFile(null);
    setUploadDisplayName('');
    setDragActive(false);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600,
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <UploadIcon />
        음성 파일 업로드
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mt: 1 }}>
          {/* 드래그 앤 드롭 영역 */}
          <Box
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: `2px dashed ${dragActive ? '#1976d2' : uploadFile ? '#4caf50' : '#e0e0e0'}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? '#e3f2fd' : uploadFile ? '#e8f5e8' : '#fafafa',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              mb: 3,
              '&:hover': {
                borderColor: '#1976d2',
                bgcolor: '#f5f5f5'
              }
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <UploadIcon 
              sx={{ 
                fontSize: 48, 
                color: dragActive ? '#1976d2' : uploadFile ? '#4caf50' : '#bdbdbd',
                mb: 2
              }} 
            />
            
            {uploadFile ? (
              <Box>
                <Typography variant="h6" color="success.main" gutterBottom>
                  ✓ 파일 선택됨
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {uploadFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  크기: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadFile(null);
                    setUploadDisplayName('');
                  }}
                >
                  다른 파일 선택
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {dragActive ? '파일을 여기에 놓으세요' : '파일을 드래그하거나 클릭하여 선택'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  지원 형식: MP3, WAV, M4A, AAC, OGG, FLAC
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  최대 파일 크기: 100MB
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* 파일명 입력 */}
          <TextField
            fullWidth
            label="파일명 (선택사항)"
            value={uploadDisplayName}
            onChange={(e) => setUploadDisplayName(e.target.value)}
            placeholder="파일명을 입력하세요. 비워두면 원본 파일명이 사용됩니다."
            helperText="사용자가 보기 편한 이름으로 설정할 수 있습니다."
            margin="normal"
            disabled={!uploadFile}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          
          {/* 업로드 진행 상태 */}
          {uploading && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="primary">
                  업로드 중...
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                잠시만 기다려주세요. 파일을 서버에 업로드하고 있습니다.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={uploading}
          sx={{ 
            borderRadius: 2,
            px: 3,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleFileUpload} 
          variant="contained"
          disabled={!uploadFile || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            }
          }}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 