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
  // 고유한 화자 목록 추출
  const uniqueSpeakers = [...new Set(speakerLabels.map(label => label.speaker))].filter(Boolean);

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
          height: '90vh',
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
      <DialogContent sx={{ p: 3, height: '100%' }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* 화자 이름 설정 */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%', 
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                화자 이름 설정
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {uniqueSpeakers.map((speaker) => (
                  <TextField
                    key={speaker}
                    label={`화자 ${speaker}`}
                    value={speakerNames[speaker] || ''}
                    onChange={(e) => onSpeakerNameChange(speaker, e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder={`화자 ${speaker}의 이름을 입력하세요`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                ))}
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
                height: '100%', 
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
                  height: 'calc(100% - 60px)',
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {speakerTranscript || '화자 이름을 설정하면 미리보기가 표시됩니다.'}
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
          onClick={onSave}
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
    </Dialog>
  );
} 