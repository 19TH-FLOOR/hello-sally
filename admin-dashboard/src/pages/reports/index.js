import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatToKoreanDate } from '../../utils/dateUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  // 다이얼로그 상태
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // 케밥 메뉴 상태
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuReportId, setMenuReportId] = useState(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    parent_name: '',
    child_name: ''
  });

  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10'
      });
      
      if (statusFilter) {
        params.append('status_filter', statusFilter);
      }
      
      const response = await fetch(`${API_BASE_URL}/reports?${params}`);
      if (!response.ok) throw new Error('보고서 목록을 불러올 수 없습니다.');
      
      const data = await response.json();
      setReports(data.reports);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    if (!formData.title.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('보고서 생성에 실패했습니다.');
      
      setCreateDialogOpen(false);
      setFormData({ title: '', parent_name: '', child_name: '' });
      toast.success('보고서가 생성되었습니다.');
      fetchReports();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    toast((t) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        minWidth: '280px',
        padding: '4px'
      }}>
        <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
          정말로 이 보고서를 삭제하시겠습니까?<br/>
          모든 음성 파일과 분석 결과가 삭제됩니다.<br/>
          이 작업은 되돌릴 수 없습니다.
        </span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDeleteReport(reportId);
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            삭제
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: {
        minWidth: '300px',
        padding: '16px',
      }
    });
  };

  const executeDeleteReport = async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('보고서 삭제에 실패했습니다.');
      
      toast.success('보고서가 삭제되었습니다.');
      fetchReports();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      analyzing: 'warning',
      completed: 'info',
      published: 'success'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: '초안',
      analyzing: '분석중',
      completed: '완료',
      published: '발행됨'
    };
    return texts[status] || status;
  };

  // 케밥 메뉴 핸들러
  const handleMenuOpen = (event, reportId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuReportId(reportId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReportId(null);
  };

  const handleRowClick = (reportId) => {
    router.push(`/reports/${reportId}`);
  };

  if (loading) {
    return <Typography>로딩 중...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* 헤더 섹션 */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 4,
          mb: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            보고서 관리
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            AI 분석 보고서를 생성하고 관리합니다
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            px: 3,
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
            }
          }}
        >
          새 보고서
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 필터 섹션 */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 3,
          mb: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>상태 필터</InputLabel>
          <Select
            value={statusFilter}
            label="상태 필터"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="draft">초안</MenuItem>
            <MenuItem value="analyzing">분석중</MenuItem>
            <MenuItem value="completed">완료</MenuItem>
            <MenuItem value="published">발행됨</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 테이블 섹션 */}
      <TableContainer 
        component={Paper}
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>제목</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>부모</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>아이</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>생성일</TableCell>
              <TableCell width="50" sx={{ fontWeight: 600, color: 'text.primary' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow 
                key={report.id}
                onClick={() => handleRowClick(report.id)}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    transform: 'scale(1.01)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }
                }}
              >
                <TableCell>{report.id}</TableCell>
                <TableCell>{report.title}</TableCell>
                <TableCell>{report.parent_name || '-'}</TableCell>
                <TableCell>{report.child_name || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(report.status)}
                    color={getStatusColor(report.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {formatToKoreanDate(report.created_at)}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, report.id)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
        />
      </Box>

      {/* 생성 다이얼로그 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            textAlign: 'center',
            borderRadius: '12px 12px 0 0'
          }}
        >
          새 보고서 생성
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <TextField
            fullWidth
            label="보고서 제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          />
          <TextField
            fullWidth
            label="부모 이름"
            value={formData.parent_name}
            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          />
          <TextField
            fullWidth
            label="아이 이름"
            value={formData.child_name}
            onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
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
            onClick={handleCreateReport} 
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* 케밥 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem 
          onClick={() => handleDeleteReport(menuReportId)}
          disabled={reports.find(r => r.id === menuReportId)?.status === 'published'}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>삭제</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
} 