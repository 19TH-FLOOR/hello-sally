import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Box,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import Link from 'next/link';
import { formatToKoreanDateTime } from '../../utils/dateUtils';
import InterpolationHelper from '../../components/reports/InterpolationHelper';
import PromptEditor, { UsedVariables } from '../../components/reports/PromptEditor';

// API 요청은 Next.js 프록시(/api)를 통해 처리
const API_BASE_URL = '/api';

export default function AIPromptDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [interpolationVariables, setInterpolationVariables] = useState([]);
  const [currentPositions, setCurrentPositions] = useState({}); // 각 변수의 현재 위치 추적
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_content: '',
    is_default: false
  });

  // 텍스트 필드 참조
  const promptTextFieldRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchPromptDetail();
    }
  }, [id]);

  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name || '',
        description: prompt.description || '',
        prompt_content: prompt.prompt_content || '',
        is_default: prompt.is_default || false
      });
    }
  }, [prompt]);

  const fetchPromptDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${id}`);
      if (!response.ok) throw new Error('프롬프트를 불러올 수 없습니다.');
      
      const data = await response.json();
      setPrompt(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!formData.name.trim()) {
      toast.error('프롬프트 이름을 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('프롬프트 수정에 실패했습니다.');
      
      toast.success('프롬프트가 수정되었습니다.');
      fetchPromptDetail();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async () => {
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
              executeDeletePrompt();
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

  const executeDeletePrompt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('프롬프트 삭제에 실패했습니다.');
      
      toast.success('프롬프트가 삭제되었습니다.');
      router.push('/ai-prompts');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleVariablesLoad = (variables) => {
    setInterpolationVariables(variables);
  };

  // 변수 클릭 핸들러
  const handleVariableClick = (variable) => {
    if (!promptTextFieldRef.current) return;
    
    const textField = promptTextFieldRef.current.querySelector('textarea');
    if (!textField) return;

    const positions = [];
    let index = 0;
    while ((index = formData.prompt_content.indexOf(variable, index)) !== -1) {
      positions.push(index);
      index += variable.length;
    }

    if (positions.length === 0) return;

    // 현재 변수의 위치 인덱스 가져오기 (없으면 0)
    const currentIndex = currentPositions[variable] || 0;
    const nextIndex = (currentIndex + 1) % positions.length;
    
    // 다음 위치로 업데이트
    setCurrentPositions(prev => ({
      ...prev,
      [variable]: nextIndex
    }));

    const position = positions[nextIndex];
    textField.focus();
    textField.setSelectionRange(position, position + variable.length);
    
    // 스크롤 위치 계산 및 이동
    const lines = formData.prompt_content.substring(0, position).split('\n');
    const lineNumber = lines.length - 1;
    const lineHeight = 21; // 대략적인 라인 높이
    const scrollTop = Math.max(0, (lineNumber * lineHeight) - (textField.clientHeight / 2));
    
    textField.scrollTop = scrollTop;

    // 토스트 알림
    if (positions.length > 1) {
      toast.success(`${variable} 변수 (${nextIndex + 1}/${positions.length})로 이동했습니다.`, {
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!prompt) {
    return (
      <Box p={3}>
        <Alert severity="warning">프롬프트를 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* 헤더 */}
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
          <Link href="/ai-prompts" passHref>
            <Button 
              variant="text" 
              color="primary" 
              sx={{ mb: 1, color: 'text.secondary' }}
            >
              ← AI 프롬프트 목록으로
            </Button>
          </Link>
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
            AI 프롬프트 상세
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            프롬프트 정보를 확인하고 수정할 수 있습니다
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeletePrompt}
            disabled={saving}
            sx={{
              borderRadius: 2,
              px: 3,
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
              }
            }}
          >
            삭제
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdatePrompt}
            disabled={saving}
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
            {saving ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </Box>

      {/* 메타데이터 정보 */}
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
        <Typography variant="body2" color="text.secondary">
          생성일: {formatToKoreanDateTime(prompt.created_at)}
        </Typography>
        {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
          <Typography variant="body2" color="text.secondary">
            수정일: {formatToKoreanDateTime(prompt.updated_at)}
          </Typography>
        )}
      </Box>

      {/* 프롬프트 정보 */}
      <Grid container spacing={3}>
        {/* 기본 정보 - 왼쪽 */}
        <Grid item xs={12} md={4}>
          <Box 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              p: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              mb: 3
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 3
              }}
            >
              기본 정보
            </Typography>
            
            <TextField
              fullWidth
              label="프롬프트 이름"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.8)',
                }
              }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ 
                mb: 3,
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
            />
          </Box>

          {/* 인터폴레이션 헬퍼 */}
          <Box 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              p: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <InterpolationHelper 
              variant="compact" 
              textFieldRef={promptTextFieldRef}
              formData={formData}
              onVariablesLoad={handleVariablesLoad}
              onVariableClick={handleVariableClick}
              currentPositions={currentPositions}
            />
          </Box>
        </Grid>
        
        {/* 프롬프트 내용 - 오른쪽 */}
        <Grid item xs={12} md={8}>
          <Box 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              p: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 3
              }}
            >
              프롬프트 내용
            </Typography>
            
            {/* 사용된 변수 표시 */}
            <UsedVariables 
              value={formData.prompt_content}
              interpolationVariables={interpolationVariables}
              onVariableClick={handleVariableClick}
              currentPositions={currentPositions}
            />
            
            <PromptEditor
              ref={promptTextFieldRef}
              value={formData.prompt_content}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt_content: e.target.value }))}
              placeholder="AI 분석을 위한 프롬프트를 입력하세요..."
              rows={20}
              label="프롬프트 내용"
              interpolationVariables={interpolationVariables}
              showUsedVariables={false}
              onVariableClick={handleVariableClick}
              currentPositions={currentPositions}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 