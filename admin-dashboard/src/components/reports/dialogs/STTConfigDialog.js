import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import { Settings as SettingsIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';

export default function STTConfigDialog({
  open,
  onClose,
  sttConfig,
  setSttConfig,
  onSave,
  onRestart,
  selectedAudioFile,
  loading = false
}) {
  if (!sttConfig) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
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
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          STT 설정 - {selectedAudioFile?.filename}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<OpenInNewIcon />}
          onClick={() => window.open('https://developers.rtzr.ai/docs/stt-file/', '_blank')}
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.75rem',
            textTransform: 'none',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          📖 API 문서 보기
        </Button>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 모델 설정 */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                모델 설정
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>모델 타입</InputLabel>
                  <Select
                    value={sttConfig.model_type}
                    label="모델 타입"
                    onChange={(e) => setSttConfig({ ...sttConfig, model_type: e.target.value })}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="sommers">Sommers (리턴제로 기본)</MenuItem>
                    <MenuItem value="whisper">Whisper</MenuItem>
                  </Select>
                </FormControl>
                
                {sttConfig.model_type === 'whisper' && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>언어</InputLabel>
                      <Select
                        value={sttConfig.language}
                        label="언어"
                        onChange={(e) => setSttConfig({ ...sttConfig, language: e.target.value })}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="ko">한국어</MenuItem>
                        <MenuItem value="en">영어</MenuItem>
                        <MenuItem value="ja">일본어</MenuItem>
                        <MenuItem value="zh">중국어</MenuItem>
                        <MenuItem value="detect">자동 감지</MenuItem>
                        <MenuItem value="multi">다중 언어</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {(sttConfig.language === 'detect' || sttConfig.language === 'multi') && (
                      <TextField
                        fullWidth
                        label="언어 감지 후보군 (쉼표로 구분)"
                        value={sttConfig.language_candidates ? sttConfig.language_candidates.join(', ') : ''}
                        onChange={(e) => setSttConfig({
                          ...sttConfig,
                          language_candidates: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)
                        })}
                        placeholder="ko, en, ja, zh"
                        helperText="감지할 언어들을 쉼표로 구분하여 입력하세요"
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
                    )}
                  </>
                )}
              </Box>
            </Box>

            {/* 화자 분리 설정 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              borderRadius: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                화자 분리 설정
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={sttConfig.speaker_diarization}
                    onChange={(e) => setSttConfig({ ...sttConfig, speaker_diarization: e.target.checked })}
                    color="primary"
                  />
                }
                label="화자 분리 사용"
                sx={{ mb: 2 }}
              />
              
              {sttConfig.speaker_diarization && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    화자 수 설정
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>화자 수</InputLabel>
                    <Select
                      value={sttConfig.spk_count}
                      label="화자 수"
                      onChange={(e) => setSttConfig({ ...sttConfig, spk_count: parseInt(e.target.value) })}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={4}>4</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>

            {/* 필터 설정 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              borderRadius: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                필터 설정
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sttConfig.profanity_filter}
                      onChange={(e) => setSttConfig({ ...sttConfig, profanity_filter: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="비속어 필터"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={sttConfig.use_disfluency_filter}
                      onChange={(e) => setSttConfig({ ...sttConfig, use_disfluency_filter: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="간투어 필터"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={sttConfig.use_paragraph_splitter}
                      onChange={(e) => setSttConfig({ ...sttConfig, use_paragraph_splitter: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="문단 나누기"
                />
                {sttConfig.use_paragraph_splitter && (
                  <TextField
                    fullWidth
                    label="문단 최대 길이"
                    type="number"
                    value={sttConfig.paragraph_max_length}
                    onChange={(e) => setSttConfig({ ...sttConfig, paragraph_max_length: parseInt(e.target.value) })}
                    sx={{ 
                      mt: 1,
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
                )}
              </Box>
            </Box>

            {/* 고급 설정 */}
            <Box sx={{ 
              p: 2, 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              borderRadius: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                고급 설정
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>도메인</InputLabel>
                  <Select
                    value={sttConfig.domain}
                    label="도메인"
                    onChange={(e) => setSttConfig({ ...sttConfig, domain: e.target.value })}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="GENERAL">일반</MenuItem>
                    <MenuItem value="CALL">통화</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="키워드 부스팅 (쉼표로 구분)"
                  value={sttConfig.keywords ? sttConfig.keywords.join(', ') : ''}
                  onChange={(e) => setSttConfig({
                    ...sttConfig,
                    keywords: e.target.value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)
                  })}
                  placeholder="키워드1, 키워드2, 키워드3"
                  helperText="인식 정확도를 높일 키워드들을 쉼표로 구분하여 입력하세요"
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
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button 
          onClick={onClose}
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
          onClick={onSave}
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
            }
          }}
        >
          {loading ? '저장 중...' : '설정 저장'}
        </Button>
        <Button 
          onClick={onRestart}
          variant="contained"
          disabled={loading}
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
          설정 저장 후 STT 재시작
        </Button>
      </DialogActions>
    </Dialog>
  );
} 