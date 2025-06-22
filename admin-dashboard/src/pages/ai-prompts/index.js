import { useState, useEffect, useRef } from 'react';
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
  FormControlLabel,
  Switch,
  Alert,
  Pagination,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { formatToKoreanDate } from '../../utils/dateUtils';
import InterpolationHelper from '../../components/reports/InterpolationHelper';

// API 요청은 Next.js 프록시(/api)를 통해 처리
const API_BASE_URL = '/api';

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 다이얼로그 상태
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  
  // 케밥 메뉴 상태
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPromptId, setMenuPromptId] = useState(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_content: '',
    is_default: false
  });

  // 텍스트 필드 참조
  const promptTextFieldRef = useRef(null);

  const router = useRouter();

  useEffect(() => {
    fetchPrompts();
  }, [page]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10'
      });
      
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report?${params}`);
      if (!response.ok) throw new Error('프롬프트 목록을 불러올 수 없습니다.');
      
      const data = await response.json();
      setPrompts(data.templates);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    if (!formData.name.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('프롬프트 생성에 실패했습니다.');
      
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', prompt_content: '', is_default: false });
      toast.success('프롬프트가 생성되었습니다.');
      fetchPrompts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    toast((t) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        minWidth: '280px',
        padding: '4px'
      }}>
        <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
          정말로 이 프롬프트를 삭제하시겠습니까?<br/>
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
              executeDeletePrompt(promptId);
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

  const executeDeletePrompt = async (promptId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${promptId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('프롬프트 삭제에 실패했습니다.');
      
      toast.success('프롬프트가 삭제되었습니다.');
      fetchPrompts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMenuOpen = (event, promptId) => {
    setAnchorEl(event.currentTarget);
    setMenuPromptId(promptId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPromptId(null);
  };

  const handleRowClick = (promptId) => {
    router.push(`/ai-prompts/${promptId}`);
  };

  const handleMenuAction = (action) => {
    const prompt = prompts.find(p => p.id === menuPromptId);
    if (!prompt) return;

    switch (action) {
      case 'view':
        router.push(`/ai-prompts/${prompt.id}`);
        break;
      case 'edit':
        router.push(`/ai-prompts/${prompt.id}`);
        break;
      case 'delete':
        handleDeletePrompt(prompt.id);
        break;
    }
    handleMenuClose();
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
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
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            AI 프롬프트 관리
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            AI 분석을 위한 프롬프트를 생성하고 관리합니다
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
            px: 3,
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(135deg, #e879f9 0%, #ef4444 100%)',
              boxShadow: '0 6px 24px rgba(240, 147, 251, 0.4)',
            }
          }}
        >
          새 프롬프트 생성
        </Button>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 프롬프트 테이블 */}
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
            <TableRow sx={{ backgroundColor: 'rgba(240, 147, 251, 0.05)' }}>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>이름</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>설명</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>기본 프롬프트</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>생성일</TableCell>
              <TableCell width="50" sx={{ fontWeight: 600, color: 'text.primary' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow 
                key={prompt.id}
                onClick={() => handleRowClick(prompt.id)}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(240, 147, 251, 0.08)',
                    transform: 'scale(1.01)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }
                }}
              >
                <TableCell>{prompt.id}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {prompt.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {truncateText(prompt.description, 80)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {prompt.is_default ? (
                    <Chip label="기본" color="primary" size="small" />
                  ) : (
                    <Chip label="일반" variant="outlined" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatToKoreanDate(prompt.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, prompt.id);
                    }}
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* 케밥 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>상세 보기</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>수정</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>삭제</ListItemText>
        </MenuItem>
      </Menu>

      {/* 새 프롬프트 생성 다이얼로그 */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            fontWeight: 600,
            textAlign: 'center',
            borderRadius: '12px 12px 0 0'
          }}
        >
          새 AI 프롬프트 생성
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <TextField
            fullWidth
            label="프롬프트 이름"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            multiline
            rows={3}
            label="설명"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          />
          
          {/* 인터폴레이션 헬퍼 */}
          <InterpolationHelper 
            variant="compact" 
            textFieldRef={promptTextFieldRef}
            formData={formData}
            sx={{ mt: 2 }}
          />
          
          <TextField
            ref={promptTextFieldRef}
            fullWidth
            multiline
            rows={10}
            label="프롬프트 내용"
            value={formData.prompt_content}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt_content: e.target.value }))}
            margin="normal"
            required
            placeholder="AI 분석을 위한 프롬프트를 입력하세요..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#f093fb',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#f093fb',
                  },
                }}
              />
            }
            label="기본 프롬프트로 설정"
            sx={{ mt: 2 }}
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
            onClick={handleCreatePrompt} 
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #e879f9 0%, #ef4444 100%)',
                boxShadow: '0 6px 24px rgba(240, 147, 251, 0.4)',
              }
            }}
          >
            생성
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 