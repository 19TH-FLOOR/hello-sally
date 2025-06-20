import { useState, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { formatToKoreanDate } from '../../utils/dateUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 다이얼로그 상태
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_content: '',
    is_default: false
  });

  useEffect(() => {
    fetchTemplates();
  }, [page]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10'
      });
      
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report?${params}`);
      if (!response.ok) throw new Error('프롬프트 목록을 불러올 수 없습니다.');
      
      const data = await response.json();
      setTemplates(data.templates);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
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
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('프롬프트 수정에 실패했습니다.');
      
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      setFormData({ name: '', description: '', prompt_content: '', is_default: false });
      toast.success('프롬프트가 수정되었습니다.');
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    toast((t) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        minWidth: '280px',
        padding: '4px'
      }}>
        <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
          정말로 이 프롬프트를 삭제하시겠습니까?
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
              executeDeleteTemplate(templateId);
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

  const executeDeleteTemplate = async (templateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${templateId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('프롬프트 삭제에 실패했습니다.');
      
      toast.success('프롬프트가 삭제되었습니다.');
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditClick = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      prompt_content: template.prompt_content,
      is_default: template.is_default
    });
    setEditDialogOpen(true);
  };

  const handleViewClick = (template) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  if (loading) {
    return <Typography>로딩 중...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          보고서 AI 프롬프트 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormData({ name: '', description: '', prompt_content: '', is_default: false });
            setCreateDialogOpen(true);
          }}
        >
          새 프롬프트
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>프롬프트명</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>기본 프롬프트</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.id}</TableCell>
                <TableCell>{template.name}</TableCell>
                <TableCell>
                  {template.description ? 
                    template.description.length > 50 ? 
                      `${template.description.substring(0, 50)}...` : 
                      template.description 
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.is_default ? '기본' : '사용자 정의'}
                    color={template.is_default ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {formatToKoreanDate(template.created_at)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Button
                      onClick={() => handleViewClick(template)}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                    >
                      보기
                    </Button>
                    <Button
                      onClick={() => handleEditClick(template)}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                    >
                      수정
                    </Button>
                    <Button
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={template.is_default}
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                    >
                      삭제
                    </Button>
                  </Box>
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
      <Dialog open={createDialogOpen} onClose={() => {
        setCreateDialogOpen(false);
        setFormData({ name: '', description: '', prompt_content: '', is_default: false });
      }} maxWidth="md" fullWidth>
        <DialogTitle>새 프롬프트 생성</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="프롬프트명"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="설명"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="프롬프트 내용"
            value={formData.prompt_content}
            onChange={(e) => setFormData({ ...formData, prompt_content: e.target.value })}
            margin="normal"
            multiline
            rows={10}
            required
            placeholder="AI 분석을 위한 프롬프트를 입력하세요..."
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
            }
            label="기본 프롬프트로 설정"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setFormData({ name: '', description: '', prompt_content: '', is_default: false });
          }}>취소</Button>
          <Button onClick={handleCreateTemplate} variant="contained">
            생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => {
        setEditDialogOpen(false);
        setSelectedTemplate(null);
        setFormData({ name: '', description: '', prompt_content: '', is_default: false });
      }} maxWidth="md" fullWidth>
        <DialogTitle>프롬프트 수정</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="프롬프트명"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="설명"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="프롬프트 내용"
            value={formData.prompt_content}
            onChange={(e) => setFormData({ ...formData, prompt_content: e.target.value })}
            margin="normal"
            multiline
            rows={10}
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
            }
            label="기본 프롬프트로 설정"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedTemplate(null);
            setFormData({ name: '', description: '', prompt_content: '', is_default: false });
          }}>취소</Button>
          <Button onClick={handleUpdateTemplate} variant="contained">
            수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>프롬프트 상세보기</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  템플릿명
                </Typography>
                <Typography variant="body1">{selectedTemplate.name}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  설명
                </Typography>
                <Typography variant="body1">
                  {selectedTemplate.description || '설명 없음'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  기본 템플릿 여부
                </Typography>
                <Chip
                  label={selectedTemplate.is_default ? '기본 템플릿' : '사용자 정의'}
                  color={selectedTemplate.is_default ? 'primary' : 'default'}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  프롬프트 내용
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}
                >
                  {selectedTemplate.prompt_content}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
      
      
    </Box>
  );
} 