import { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  IconButton, Chip, Tooltip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Snackbar, Alert
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import TranscribeIcon from '@mui/icons-material/RecordVoiceOver';
import { getAudioFiles, downloadFile, deleteAudioFile, startTranscription, getTranscript } from '../../utils/api';

export default function UploadList() {
  // API에서 파일 목록 조회
  const { data, isLoading, error, refetch } = useQuery('audioFiles', getAudioFiles, {
    refetchOnWindowFocus: false
  });

  // 삭제 관련 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // STT 관련 상태
  const [transcribeLoading, setTranscribeLoading] = useState({});
  const [transcriptDialog, setTranscriptDialog] = useState({ open: false, file: null, transcript: '' });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" color="error" gutterBottom>
          데이터를 불러오는 중 오류가 발생했습니다.
        </Typography>
        <Button variant="contained" onClick={() => refetch()}>
          다시 시도
        </Button>
      </Box>
    );
  }

  // Mock data - API 연동 전 테스트용
  const mockFiles = [
    { id: 1, filename: 'test1.wav', s3_url: 'https://example.com/1.wav', uploaded_at: '2023-07-01T12:00:00Z' },
    { id: 2, filename: 'test2.mp3', s3_url: 'https://example.com/2.mp3', uploaded_at: '2023-07-02T14:30:00Z' },
    { id: 3, filename: 'meeting.m4a', s3_url: 'https://example.com/3.m4a', uploaded_at: '2023-07-03T09:15:00Z' },
  ];

  const files = data?.length > 0 ? data : mockFiles;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleDownload = async (file) => {
    try {
      setDownloadLoading(true);
      await downloadFile(file.id, file.filename);
      setSnackbar({
        open: true,
        message: '파일 다운로드가 시작되었습니다.',
        severity: 'success'
      });
    } catch (err) {
      console.error('Download failed:', err);
      setSnackbar({
        open: true,
        message: '파일 다운로드 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // 삭제 기능
  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteAudioFile(fileToDelete.id);
      setSnackbar({
        open: true,
        message: '파일이 성공적으로 삭제되었습니다.',
        severity: 'success'
      });
      // 목록 새로고침
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
      setSnackbar({
        open: true,
        message: '파일 삭제 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // STT 처리 시작
  const handleTranscribe = async (file) => {
    setTranscribeLoading({ ...transcribeLoading, [file.id]: true });
    try {
      await startTranscription(file.id);
      setSnackbar({
        open: true,
        message: 'STT 처리가 시작되었습니다. 잠시 후 결과를 확인해주세요.',
        severity: 'success'
      });
      // 목록 새로고침
      refetch();
    } catch (err) {
      console.error('STT 처리 시작 실패:', err);
      setSnackbar({
        open: true,
        message: 'STT 처리 시작 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setTranscribeLoading({ ...transcribeLoading, [file.id]: false });
    }
  };

  // STT 결과 보기
  const handleViewTranscript = async (file) => {
    try {
      const result = await getTranscript(file.id);
      setTranscriptDialog({
        open: true,
        file: file,
        transcript: result.stt_transcript || '텍스트 변환 결과가 없습니다.'
      });
    } catch (err) {
      console.error('STT 결과 조회 실패:', err);
      setSnackbar({
        open: true,
        message: 'STT 결과 조회 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleTranscriptDialogClose = () => {
    setTranscriptDialog({ open: false, file: null, transcript: '' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          파일 목록
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          href="/uploads/new"
        >
          새 파일 업로드
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>파일명</TableCell>
              <TableCell>확장자</TableCell>
              <TableCell>업로드 일시</TableCell>
              <TableCell>STT 상태</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.id}</TableCell>
                <TableCell>{file.filename}</TableCell>
                <TableCell>
                  <Chip 
                    label={file.filename.split('.').pop()} 
                    size="small" 
                    color={
                      file.filename.endsWith('.wav') ? 'primary' : 
                      file.filename.endsWith('.mp3') ? 'secondary' : 
                      'default'
                    }
                  />
                </TableCell>
                <TableCell>{formatDate(file.uploaded_at)}</TableCell>
                <TableCell>
                  <Chip 
                    label={
                      file.stt_status === 'pending' ? '대기' :
                      file.stt_status === 'processing' ? '처리중' :
                      file.stt_status === 'completed' ? '완료' :
                      file.stt_status === 'failed' ? '실패' : '알 수 없음'
                    }
                    size="small"
                    color={
                      file.stt_status === 'completed' ? 'success' :
                      file.stt_status === 'processing' ? 'warning' :
                      file.stt_status === 'failed' ? 'error' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="다운로드">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleDownload(file)}
                        disabled={downloadLoading}
                      >
                        <CloudDownloadIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {/* STT 처리 버튼 */}
                    {file.stt_status === 'pending' && (
                      <Tooltip title="STT 처리 시작">
                        <IconButton 
                          color="secondary" 
                          onClick={() => handleTranscribe(file)}
                          disabled={transcribeLoading[file.id]}
                        >
                          {transcribeLoading[file.id] ? <CircularProgress size={20} /> : <TranscribeIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* STT 결과 보기 버튼 */}
                    {file.stt_status === 'completed' && (
                      <Tooltip title="STT 결과 보기">
                        <IconButton 
                          color="info" 
                          onClick={() => handleViewTranscript(file)}
                        >
                          <TranscribeIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="삭제">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(file)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {files.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  업로드된 파일이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 삭제 확인 대화상자 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          파일 삭제 확인
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            '{fileToDelete?.filename}' 파일을 삭제하시겠습니까?
            <br />
            이 작업은 취소할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            취소
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
          >
            {deleteLoading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* STT 결과 대화상자 */}
      <Dialog
        open={transcriptDialog.open}
        onClose={handleTranscriptDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          STT 결과 - {transcriptDialog.file?.filename}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {transcriptDialog.transcript}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTranscriptDialogClose}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 스낵바 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 