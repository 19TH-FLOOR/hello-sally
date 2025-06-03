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
import { getAudioFiles, downloadFile, deleteAudioFile } from '../../utils/api';

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
                <TableCell colSpan={5} align="center">
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