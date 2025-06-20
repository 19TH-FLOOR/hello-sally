import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TranscriptEditPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 편집 상태
  const [content, setContent] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const [originalContent, setOriginalContent] = useState(''); // 원본 내용 저장
  const [showSpeakerNames, setShowSpeakerNames] = useState(true); // 화자명 표시 여부
  const [isToggling, setIsToggling] = useState(false); // 토글 중인지 여부
  
  // 미리보기 다이얼로그
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // 화자명 제거/추가 함수
  const removeSpeakerNames = useCallback((text) => {
    if (!text) return '';
    // 다양한 화자명 패턴 제거
    // 1. "화자명: " 패턴 (한글, 영어, 숫자, 공백, 특수문자 포함)
    // 2. "Speaker 1: ", "사용자: ", "상담원: " 등
    return text.replace(/^[가-힣a-zA-Z0-9\s\-_]+:\s*/gm, '').trim();
  }, []);

  const addSpeakerNames = useCallback((text) => {
    if (!text) return '';
    // 이미 화자명이 있는 경우 원본 반환
    if (/^[가-힣a-zA-Z0-9\s\-_]+:\s*/m.test(text)) {
      return text;
    }
    // 화자명이 없는 경우 원본에서 복원
    return originalContent;
  }, [originalContent]);

  // 화자명 표시 토글 함수
  const toggleSpeakerNames = useCallback(async (show) => {
    setIsToggling(true);
    
    // 약간의 지연으로 부드러운 전환 효과
    setTimeout(() => {
      setShowSpeakerNames(show);
      if (show) {
        // 화자명 표시: 원본 내용 사용
        setContent(originalContent);
        toast.success('화자명이 표시됩니다.');
      } else {
        // 화자명 숨김: 화자명 제거된 내용 사용
        const contentWithoutSpeakers = removeSpeakerNames(originalContent);
        setContent(contentWithoutSpeakers);
        toast.success('화자명이 숨겨집니다.');
      }
      setIsToggling(false);
    }, 100);
  }, [originalContent, removeSpeakerNames]);

  useEffect(() => {
    if (id) {
      fetchTranscriptData();
    }
  }, [id]);

  const fetchTranscriptData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/audio-files/${id}/transcript/edit`);
      if (!response.ok) throw new Error('STT 결과를 불러올 수 없습니다.');
      
      const data = await response.json();
      setTranscriptData(data);
      setContent(data.transcript_content || '');
      setIsEdited(data.is_edited);
      setOriginalContent(data.transcript_content || '');
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      
      // 저장할 내용 결정
      let contentToSave;
      if (showSpeakerNames) {
        // 화자명이 표시된 상태: 현재 편집된 내용 그대로 저장
        contentToSave = content;
      } else {
        // 화자명이 숨겨진 상태: 사용자가 편집한 내용을 화자명과 함께 재구성
        // 원본에서 화자명 패턴을 추출하고 편집된 내용과 결합
        contentToSave = reconstructWithSpeakerNames(originalContent, content);
      }
      
      formData.append('content', contentToSave);
      
      const response = await fetch(`${API_BASE_URL}/audio-files/${id}/transcript`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) throw new Error('저장에 실패했습니다.');
      
      toast.success('STT 결과가 성공적으로 저장되었습니다.');
      setIsEdited(true);
      
      // 원본 내용 업데이트
      setOriginalContent(contentToSave);
      
      // 현재 표시 상태에 맞게 content 업데이트
      if (!showSpeakerNames) {
        setContent(removeSpeakerNames(contentToSave));
      } else {
        setContent(contentToSave);
      }
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 화자명과 내용을 재구성하는 함수
  const reconstructWithSpeakerNames = useCallback((original, editedContent) => {
    if (!original || !editedContent) return editedContent;
    
    // 원본에서 화자명 패턴 추출
    const originalLines = original.split('\n');
    const editedLines = editedContent.split('\n');
    
    const reconstructedLines = [];
    let editedIndex = 0;
    
    for (let i = 0; i < originalLines.length && editedIndex < editedLines.length; i++) {
      const originalLine = originalLines[i];
      const speakerMatch = originalLine.match(/^([가-힣a-zA-Z0-9\s\-_]+:\s*)/);
      
      if (speakerMatch && editedLines[editedIndex]) {
        // 화자명이 있는 경우: 화자명 + 편집된 내용
        const speakerName = speakerMatch[1];
        const editedLine = editedLines[editedIndex].trim();
        reconstructedLines.push(speakerName + editedLine);
        editedIndex++;
      } else if (editedLines[editedIndex]) {
        // 화자명이 없는 경우: 편집된 내용 그대로
        reconstructedLines.push(editedLines[editedIndex]);
        editedIndex++;
      }
    }
    
    // 남은 편집된 라인들 추가
    while (editedIndex < editedLines.length) {
      reconstructedLines.push(editedLines[editedIndex]);
      editedIndex++;
    }
    
    return reconstructedLines.join('\n');
  }, []);

  const handlePreview = () => {
    setPreviewDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      processing: 'warning',
      completed: 'success',
      failed: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '대기중',
      processing: '처리중',
      completed: '완료',
      failed: '실패'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button component={Link} href="/uploads" startIcon={<ArrowBackIcon />}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  if (!transcriptData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>STT 결과를 찾을 수 없습니다.</Typography>
        <Button component={Link} href="/uploads" startIcon={<ArrowBackIcon />}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/uploads"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          목록으로
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          STT 결과 편집
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PlayIcon />}
            onClick={handlePreview}
            sx={{ mr: 1 }}
          >
            미리보기
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 파일 정보 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                파일 정보
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  파일명
                </Typography>
                <Typography variant="body1">
                  {transcriptData.filename}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  STT 상태
                </Typography>
                <Chip
                  label={getStatusText(transcriptData.stt_status)}
                  color={getStatusColor(transcriptData.stt_status)}
                  size="small"
                />
              </Box>
              {transcriptData.stt_processed_at && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    처리일시
                  </Typography>
                  <Typography variant="body1">
                    {new Date(transcriptData.stt_processed_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  편집 여부
                </Typography>
                <Chip
                  label={isEdited ? '편집됨' : '원본'}
                  color={isEdited ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 편집 영역 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  대화 내용 편집
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showSpeakerNames}
                      onChange={(e) => toggleSpeakerNames(e.target.checked)}
                      color="primary"
                      disabled={isToggling}
                    />
                  }
                  label="화자명 표시"
                  sx={{ ml: 2 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                STT 결과를 확인하고 필요에 따라 수정하세요. 수정된 내용은 AI 분석에 사용됩니다.
                {!showSpeakerNames && (
                  <Box component="span" sx={{ color: 'warning.main', ml: 1 }}>
                    • 화자명이 숨겨진 상태입니다. 저장 시 원본 화자명이 유지됩니다.
                  </Box>
                )}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={20}
                variant="outlined"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="STT 결과가 여기에 표시됩니다..."
                disabled={isToggling}
                sx={{ 
                  fontFamily: 'monospace',
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                    lineHeight: 1.5
                  },
                  opacity: isToggling ? 0.7 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  글자 수: {content.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  줄 수: {content.split('\n').length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 미리보기 다이얼로그 */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            대화 내용 미리보기
            <FormControlLabel
              control={
                <Switch
                  checked={showSpeakerNames}
                  onChange={(e) => toggleSpeakerNames(e.target.checked)}
                  color="primary"
                  size="small"
                  disabled={isToggling}
                />
              }
              label="화자명 표시"
              sx={{ ml: 2 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            {content || '내용이 없습니다.'}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 