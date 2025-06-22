import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Visibility as VisibilityIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';

const API_BASE_URL = '/api';

export default function AIAnalysisConfigDialog({
  open,
  onClose,
  onStartAnalysis,
  reportId
}) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');

  // 지원 모델 및 프롬프트 목록 로드
  useEffect(() => {
    if (open && reportId) {
      loadSupportedModels();
      loadAIPrompts();
    }
  }, [open, reportId]);

  const loadSupportedModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/ai-analysis/models`);
      if (response.ok) {
        const data = await response.json();
        setModels(data.supported_models || []);
        // 기본값 설정
        if (data.supported_models && data.supported_models.length > 0) {
          setSelectedModel(data.supported_models[0]);
        }
      }
    } catch (error) {
      console.error('모델 목록 로드 실패:', error);
      setError('지원 모델 목록을 불러올 수 없습니다.');
    }
  };

  const loadAIPrompts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report`);
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.templates || []);
        // 기본 프롬프트 설정
        const defaultPrompt = data.templates?.find(p => p.is_default);
        if (defaultPrompt) {
          setSelectedPrompt(defaultPrompt.id);
        } else if (data.templates && data.templates.length > 0) {
          setSelectedPrompt(data.templates[0].id);
        }
      }
    } catch (error) {
      console.error('프롬프트 목록 로드 실패:', error);
      setError('AI 프롬프트 목록을 불러올 수 없습니다.');
    }
  };

  const handlePreview = async () => {
    if (!selectedPrompt) {
      setError('AI 프롬프트를 선택해주세요.');
      return;
    }

    setPreviewLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/${reportId}/ai-analysis/preview?ai_prompt_id=${selectedPrompt}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '프롬프트 미리보기를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('프롬프트 미리보기 실패:', error);
      setError('프롬프트 미리보기 중 오류가 발생했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedModel || !selectedPrompt) {
      setError('모델과 프롬프트를 모두 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_prompt_id: selectedPrompt,
          model: selectedModel
        })
      });

      if (response.ok) {
        const data = await response.json();
        onStartAnalysis(data);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'AI 분석을 시작할 수 없습니다.');
      }
    } catch (error) {
      console.error('AI 분석 시작 실패:', error);
      setError('AI 분석 시작 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewData(null);
    setError('');
    onClose();
  };

  const selectedPromptData = prompts.find(p => p.id === selectedPrompt);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PsychologyIcon color="primary" />
        AI 분석 설정
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* OpenAI 모델 선택 */}
          <FormControl fullWidth>
            <InputLabel>OpenAI 모델</InputLabel>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              label="OpenAI 모델"
              startAdornment={<SmartToyIcon sx={{ mr: 1, color: 'action.active' }} />}
            >
              {models.map((model) => (
                <MenuItem key={model} value={model}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {model}
                    {model.includes('gpt-4.1') && (
                      <Chip label="최신" size="small" color="primary" />
                    )}
                    {model.includes('gpt-4o') && (
                      <Chip label="고성능" size="small" color="success" />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* AI 프롬프트 선택 */}
          <FormControl fullWidth>
            <InputLabel>AI 프롬프트</InputLabel>
            <Select
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              label="AI 프롬프트"
            >
              {prompts.map((prompt) => (
                <MenuItem key={prompt.id} value={prompt.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ flex: 1 }}>
                      {prompt.name}
                      {prompt.is_default && (
                        <Chip label="기본" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    {prompt.description && (
                      <Typography variant="caption" color="text.secondary">
                        {prompt.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 선택된 프롬프트 정보 */}
          {selectedPromptData && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  선택된 프롬프트: {selectedPromptData.name}
                </Typography>
                {selectedPromptData.description && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedPromptData.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* 프롬프트 미리보기 */}
          <Box>
            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={!selectedPrompt || previewLoading}
              startIcon={previewLoading ? <CircularProgress size={20} /> : <VisibilityIcon />}
              sx={{ mb: 2 }}
            >
              {previewLoading ? '미리보기 생성 중...' : '프롬프트 미리보기'}
            </Button>

            {previewData && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    프롬프트 미리보기
                  </Typography>
                  
                  {/* 대화 요약 정보 */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      대화 요약: {previewData.conversation_summary?.total_files}개 파일, 
                      총 {previewData.conversation_summary?.total_duration}초, 
                      {previewData.conversation_summary?.total_characters}자
                    </Typography>
                  </Box>

                  {/* 인터폴레이션된 프롬프트 */}
                  <Box
                    sx={{
                      maxHeight: 300,
                      overflow: 'auto',
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {previewData.interpolated_prompt}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleStartAnalysis}
          variant="contained"
          disabled={!selectedModel || !selectedPrompt || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PsychologyIcon />}
        >
          {loading ? 'AI 분석 시작 중...' : 'AI 분석 시작'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 