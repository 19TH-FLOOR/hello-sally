import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon 
} from '@mui/icons-material';

export default function FileUploadDialog({
  open,
  onClose,
  onUpload
}) {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter(file => 
        file.type.startsWith('audio/') || 
        ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )
      );
      
      if (audioFiles.length > 0) {
        addFiles(audioFiles);
      }
      
      if (audioFiles.length < files.length) {
        // 일부 파일이 오디오 파일이 아닌 경우 알림
        console.warn('일부 파일이 지원되지 않는 형식입니다.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (newFiles) => {
    const filesWithMetadata = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      displayName: '',
      size: file.size,
      name: file.name
    }));
    
    setUploadFiles(prev => [...prev, ...filesWithMetadata]);
  };

  const removeFile = (fileId) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateDisplayName = (fileId, displayName) => {
    setUploadFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, displayName } : f)
    );
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    console.log('🚀 다중 파일 업로드 시작:', uploadFiles.length, '개 파일');
    setUploading(true);
    setUploadProgress({});
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < uploadFiles.length; i++) {
        const fileData = uploadFiles[i];
        console.log(`📁 파일 ${i + 1}/${uploadFiles.length} 업로드 시작:`, fileData.name);
        
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'uploading', progress: 0 }
        }));
        
        try {
          // onUpload 함수 호출 - 개별 토스트 메시지 없이, fetchReportDetail 호출 없이 업로드만 수행
          const success = await onUpload(fileData.file, fileData.displayName, false, true);
          
          if (success) {
            console.log(`✅ 파일 ${i + 1} 업로드 성공:`, fileData.name);
            setUploadProgress(prev => ({
              ...prev,
              [fileData.id]: { status: 'completed', progress: 100 }
            }));
            successCount++;
          } else {
            console.log(`❌ 파일 ${i + 1} 업로드 실패:`, fileData.name);
            setUploadProgress(prev => ({
              ...prev,
              [fileData.id]: { status: 'error', progress: 0 }
            }));
            errorCount++;
          }
        } catch (error) {
          console.error(`파일 업로드 실패: ${fileData.name}`, error);
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: { status: 'error', progress: 0 }
          }));
          errorCount++;
        }
      }
      
      console.log(`📊 업로드 완료 - 성공: ${successCount}, 실패: ${errorCount}`);
      
      // 업로드 완료 후 통합 메시지 표시
      if (successCount > 0 && errorCount === 0) {
        // 모든 파일 업로드 성공
        const message = successCount === 1 ? 
          '파일이 성공적으로 업로드되었습니다.' : 
          `${successCount}개 파일이 모두 성공적으로 업로드되었습니다.`;
        toast.success(message);
      } else if (successCount > 0 && errorCount > 0) {
        // 일부 성공, 일부 실패
        toast.warning(`${successCount}개 파일 업로드 성공, ${errorCount}개 파일 업로드 실패`);
      } else {
        // 모든 파일 업로드 실패
        toast.error('모든 파일 업로드에 실패했습니다.');
      }
      

      
      // 모든 업로드가 완료되면 다이얼로그 바로 닫기
      console.log('🚪 다이얼로그 바로 닫기');
      handleClose();
      
    } catch (error) {
      console.error('업로드 중 오류 발생:', error);
    } finally {
      console.log('🏁 업로드 프로세스 완료, uploading 상태 해제');
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) {
      // 업로드 중일 때는 닫기 방지
      return;
    }
    setUploadFiles([]);
    setDragActive(false);
    setUploading(false);
    setUploadProgress({});
    onClose();
  };

  const getTotalSize = () => {
    return uploadFiles.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={uploading ? () => {} : handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={uploading}
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
        {uploadFiles.length > 0 && (
          <Chip 
            label={`${uploadFiles.length}개 파일`}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              color: 'white',
              ml: 1
            }}
          />
        )}
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
              border: `2px dashed ${dragActive ? '#1976d2' : uploadFiles.length > 0 ? '#4caf50' : '#e0e0e0'}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? '#e3f2fd' : uploadFiles.length > 0 ? '#e8f5e8' : '#fafafa',
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
              multiple
              style={{ display: 'none' }}
            />
            
            <UploadIcon 
              sx={{ 
                fontSize: 48, 
                color: dragActive ? '#1976d2' : uploadFiles.length > 0 ? '#4caf50' : '#bdbdbd',
                mb: 2
              }} 
            />
            
            {uploadFiles.length > 0 ? (
              <Box>
                <Typography variant="h6" color="success.main" gutterBottom>
                  ✓ {uploadFiles.length}개 파일 선택됨
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 크기: {formatFileSize(getTotalSize())}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-input').click();
                  }}
                >
                  파일 추가
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
                  여러 파일을 한 번에 선택할 수 있습니다 (최대 파일 크기: 100MB)
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* 선택된 파일 목록 */}
          {uploadFiles.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon />
                선택된 파일 ({uploadFiles.length}개)
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                {uploadFiles.map((fileData) => (
                  <ListItem key={fileData.id} sx={{ py: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {fileData.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({formatFileSize(fileData.size)})
                          </Typography>
                          {uploadProgress[fileData.id] && (
                            <Chip
                              size="small"
                              label={
                                uploadProgress[fileData.id].status === 'uploading' ? '업로드 중' :
                                uploadProgress[fileData.id].status === 'completed' ? '완료' : '오류'
                              }
                              color={
                                uploadProgress[fileData.id].status === 'uploading' ? 'primary' :
                                uploadProgress[fileData.id].status === 'completed' ? 'success' : 'error'
                              }
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            size="small"
                            placeholder="표시할 이름을 입력해주세요 (선택사항, 미입력시 파일명 사용)"
                            value={fileData.displayName}
                            onChange={(e) => updateDisplayName(fileData.id, e.target.value)}
                            disabled={uploading}
                            sx={{ width: '100%', maxWidth: 500 }}
                          />
                          {uploadProgress[fileData.id]?.status === 'uploading' && (
                            <LinearProgress 
                              variant="indeterminate" 
                              sx={{ mt: 1, width: '100%', maxWidth: 300 }} 
                            />
                          )}
                        </Box>
                      }
                    />
                    <IconButton
                      onClick={() => removeFile(fileData.id)}
                      disabled={uploading}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* 업로드 진행 상태 */}
          {uploading && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="primary">
                  파일 업로드 중... ({Object.values(uploadProgress).filter(p => p.status === 'completed').length}/{uploadFiles.length})
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
          disabled={uploadFiles.length === 0 || uploading}
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
          {uploading ? `업로드 중... (${Object.values(uploadProgress).filter(p => p.status === 'completed').length}/${uploadFiles.length})` : `${uploadFiles.length}개 파일 업로드`}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 