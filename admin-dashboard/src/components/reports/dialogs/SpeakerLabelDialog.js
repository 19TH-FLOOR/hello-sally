import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { RecordVoiceOver as SpeakerIcon } from '@mui/icons-material';

export default function SpeakerLabelDialog({
  open,
  onClose,
  selectedAudioFile,
  speakerLabels,
  speakerNames,
  onSpeakerNameChange,
  speakerTranscript,
  onSave,
  loading = false
}) {
  // 컨펌 다이얼로그 상태
  const [showConfirm, setShowConfirm] = useState(false);
  
  // 로컬 미리보기 상태
  const [previewContent, setPreviewContent] = useState('');
  
  // 화자별 색상 배열 (최대 10명까지 지원)
  const speakerColors = [
    '#2563eb', // blue
    '#dc2626', // red  
    '#16a34a', // green
    '#ca8a04', // yellow
    '#9333ea', // purple
    '#c2410c', // orange
    '#0891b2', // cyan
    '#be185d', // pink
    '#65a30d', // lime
    '#7c2d12', // brown
  ];

  // 고유한 화자 목록 추출
  const uniqueSpeakers = [...new Set(speakerLabels.map(label => label.speaker))].filter(Boolean);

  // 화자별 색상 매핑 생성
  const getSpeakerColorMap = () => {
    const colorMap = {};
    uniqueSpeakers.forEach((speaker, index) => {
      colorMap[speaker] = speakerColors[index % speakerColors.length];
    });
    return colorMap;
  };

  // 텍스트를 파싱해서 스타일링된 JSX 요소로 변환
  const parsePreviewContent = (currentSpeakerNames) => {
    if (!speakerLabels || speakerLabels.length === 0) {
      return speakerTranscript || '화자 이름을 설정하면 미리보기가 표시됩니다.';
    }

    const colorMap = getSpeakerColorMap();
    const parsedElements = [];

    speakerLabels.forEach((label, index) => {
      const labelSpeaker = label.speaker || "";
      const text = label.text || "";
      
      if (labelSpeaker && text) {
        const speakerName = currentSpeakerNames[labelSpeaker] || labelSpeaker;
        const speakerColor = colorMap[labelSpeaker] || '#374151';
        
        parsedElements.push(
          <div key={index} style={{ marginBottom: '8px' }}>
            <span 
              style={{ 
                fontWeight: 'bold',
                color: speakerColor,
                backgroundColor: `${speakerColor}15`, // 15% opacity
                padding: '2px 6px',
                borderRadius: '4px',
                marginRight: '8px',
                border: `1px solid ${speakerColor}30`
              }}
            >
              {speakerName}:
            </span>
            <span style={{ color: '#374151' }}>{text}</span>
          </div>
        );
      } else if (text) {
        parsedElements.push(
          <div key={index} style={{ marginBottom: '8px', color: '#374151' }}>
            {text}
          </div>
        );
      }
    });

    return parsedElements;
  };

  // 미리보기 업데이트 함수
  const updatePreview = (currentSpeakerNames) => {
    const parsedContent = parsePreviewContent(currentSpeakerNames);
    setPreviewContent(parsedContent);
  };

  // 화자명 변경 핸들러 (로컬)
  const handleLocalSpeakerNameChange = (speaker, name) => {
    const updatedNames = { ...speakerNames, [speaker]: name };
    onSpeakerNameChange(speaker, name);
    updatePreview(updatedNames);
  };

  // props가 변경될 때 미리보기 업데이트
  useEffect(() => {
    updatePreview(speakerNames);
  }, [speakerLabels, speakerNames, speakerTranscript]);

  // 저장 버튼 클릭 시 컨펌 다이얼로그 표시
  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  // 컨펌 후 실제 저장 실행
  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSave();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          height: 'auto',
          maxHeight: '90vh',
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
          gap: 1
        }}
      >
        <SpeakerIcon />
        화자 라벨링
        {selectedAudioFile && (
          <Typography variant="body2" sx={{ ml: 2, opacity: 0.9 }}>
            - {selectedAudioFile.display_name || selectedAudioFile.filename}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* 화자 이름 설정 */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                화자 이름 설정
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {uniqueSpeakers.map((speaker, index) => {
                  const speakerColor = speakerColors[index % speakerColors.length];
                  const speakerName = speakerNames[speaker] || '';
                  
                  return (
                    <TextField
                      key={speaker}
                      label={`${speaker}`}
                      value={speakerName}
                      onChange={(e) => handleLocalSpeakerNameChange(speaker, e.target.value)}
                      fullWidth
                      variant="outlined"
                      placeholder={`${speaker}를 다른 이름으로 변경할 수 있어요`}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: speakerColor,
                          fontWeight: 600,
                          '&.Mui-focused': {
                            color: speakerColor,
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: speakerName ? `${speakerColor}08` : 'white', // 8% opacity when filled
                          '& fieldset': {
                            borderColor: `${speakerColor}40`, // 40% opacity for border
                            borderWidth: '2px',
                          },
                          '&:hover fieldset': {
                            borderColor: `${speakerColor}60`, // 60% opacity on hover
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: speakerColor,
                            borderWidth: '2px',
                          },
                          '& input': {
                            color: '#374151',
                            fontWeight: speakerName ? 600 : 400, // Bold when filled
                          },
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(14px, -9px) scale(0.75)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          borderRadius: '4px',
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: speakerColor,
                              marginRight: 1,
                              flexShrink: 0,
                            }}
                          />
                        ),
                      }}
                    />
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                화자 이름을 입력하면 우측 미리보기에서 실시간으로 확인할 수 있습니다.
              </Typography>
            </Paper>
          </Grid>
          
          {/* 미리보기 */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
                미리보기
              </Typography>
              <Box
                sx={{
                  height: '400px', // 고정 높이로 변경
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                }}
              >
                {previewContent}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
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
          onClick={handleSaveClick}
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
          {loading ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>

      {/* 컨펌 다이얼로그 */}
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>화자 라벨링 저장 확인</DialogTitle>
        <DialogContent>
          <Typography>
            화자 라벨링을 진행하게 되면 편집된 내용이 모두 초기화됩니다.
            <br />
            그래도 진행하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirm(false)}>
            취소
          </Button>
          <Button 
            onClick={handleConfirmSave}
            variant="contained" 
            color="primary"
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
} 