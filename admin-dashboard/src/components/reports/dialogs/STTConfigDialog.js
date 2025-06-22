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
  Radio,
  RadioGroup,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Settings as SettingsIcon, OpenInNew as OpenInNewIcon, Group as GroupIcon } from '@mui/icons-material';

export default function STTConfigDialog({
  open,
  onClose,
  sttConfig,
  setSttConfig,
  onSave,
  onRestart,
  selectedAudioFile,
  selectedAudioFiles = [], // 일괄 처리용 다중 파일
  loading = false,
  isBatchMode = false // 일괄 모드 여부
}) {
  if (!sttConfig) {
    return null;
  }

  const isMultipleFiles = isBatchMode && selectedAudioFiles.length > 1;
  const displayFiles = isMultipleFiles ? selectedAudioFiles : [selectedAudioFile].filter(Boolean);

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
          background: isMultipleFiles 
            ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600,
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMultipleFiles ? <GroupIcon /> : <SettingsIcon />}
          {isMultipleFiles 
            ? `일괄 STT 설정 (${selectedAudioFiles.length}개 파일)`
            : `STT 설정 - ${selectedAudioFile?.filename}`
          }
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
            {/* 일괄 모드일 때 선택된 파일 목록 표시 */}
            {isMultipleFiles && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid rgba(255, 107, 107, 0.3)', 
                borderRadius: 2,
                backgroundColor: 'rgba(255, 107, 107, 0.05)'
              }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon color="error" />
                  선택된 파일 ({selectedAudioFiles.length}개)
                </Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {selectedAudioFiles.map((file, index) => (
                    <ListItem key={file.id} sx={{ px: 0, py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {file.display_name || file.filename}
                            </Typography>
                            <Chip
                              label={file.stt_status === 'pending' ? '대기중' : '실패'}
                              color={file.stt_status === 'pending' ? 'default' : 'error'}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 모든 선택된 파일에 동일한 STT 설정이 적용됩니다.
                </Typography>
              </Box>
            )}

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
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    화자 수 설정
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={sttConfig.spk_count === null || sttConfig.spk_count === undefined ? 'auto' : 'manual'}
                      onChange={(e) => {
                        if (e.target.value === 'auto') {
                          setSttConfig({ ...sttConfig, spk_count: null });
                        } else {
                          setSttConfig({ ...sttConfig, spk_count: 2 });
                        }
                      }}
                      sx={{ gap: 1 }}
                    >
                      <FormControlLabel 
                        value="auto" 
                        control={<Radio size="small" />} 
                        label={
                          <Box>
                            <Typography variant="body2">자동 감지</Typography>
                            <Typography variant="caption" color="text.secondary">
                              AI가 자동으로 화자 수를 감지합니다
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="manual" 
                        control={<Radio size="small" />} 
                        label={
                          <Box>
                            <Typography variant="body2">수동 지정</Typography>
                            <Typography variant="caption" color="text.secondary">
                              화자 수를 직접 지정합니다
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                    
                    {sttConfig.spk_count !== null && sttConfig.spk_count !== undefined && (
                      <TextField
                        fullWidth
                        label="화자 수"
                        type="number"
                        value={sttConfig.spk_count || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 2) {
                            setSttConfig({ ...sttConfig, spk_count: value });
                          } else if (e.target.value === '') {
                            setSttConfig({ ...sttConfig, spk_count: null });
                          }
                        }}
                        inputProps={{
                          min: 2,
                          step: 1
                        }}
                        helperText="2 이상의 화자 수를 입력하세요"
                        sx={{ 
                          mt: 2,
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
                    value={sttConfig.paragraph_max_length || 50}
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
        
        {/* 일괄 모드일 때는 항상 시작 버튼만 표시 */}
        {isMultipleFiles ? (
          <Button 
            onClick={onRestart}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff5252 0%, #d63031 100%)',
                boxShadow: '0 6px 24px rgba(255, 107, 107, 0.4)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
              }
            }}
          >
            {loading ? `일괄 STT 시작 중... (${selectedAudioFiles.length}개)` : `일괄 STT 시작 (${selectedAudioFiles.length}개)`}
          </Button>
        ) : (
          /* 단일 파일 모드 버튼들 */
          selectedAudioFile?.stt_status === 'pending' ? (
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
              {loading ? 'STT 시작 중...' : 'STT 시작'}
            </Button>
          ) : (
            <>
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
            </>
          )
        )}
      </DialogActions>
    </Dialog>
  );
} 