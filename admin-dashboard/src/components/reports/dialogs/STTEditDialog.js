import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

export default function STTEditDialog({
  open,
  onClose,
  selectedAudioFile,
  sttTranscript,
  onTranscriptChange,
  onSave,
  showSpeakerNamesInEdit,
  onToggleSpeakerNames,
  hasSpeakerNames,
  loading = false
}) {
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
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          STT 결과 편집 - {selectedAudioFile?.filename}
        </Box>
        {hasSpeakerNames && (
          <FormControlLabel
            control={
              <Switch
                checked={showSpeakerNamesInEdit}
                onChange={(e) => onToggleSpeakerNames(e.target.checked)}
                color="default"
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: 'white',
                  },
                  '&.Mui-checked .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              />
            }
            label="화자명 표시"
            sx={{ 
              ml: 2,
              color: 'white',
              '& .MuiFormControlLabel-label': {
                color: 'white',
                fontSize: '0.875rem',
              }
            }}
          />
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              STT 결과를 확인하고 필요에 따라 수정하세요. 수정된 내용은 AI 분석에 사용됩니다.
            </Typography>
            {hasSpeakerNames && !showSpeakerNamesInEdit && (
              <Box sx={{ 
                mb: 2, 
                p: 1.5, 
                backgroundColor: '#e3f2fd', 
                borderRadius: 2, 
                border: '1px solid #2196f3' 
              }}>
                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                  💡 화자명이 숨겨진 상태입니다.
                </Typography>
                <Typography variant="body2" sx={{ color: '#1976d2', mt: 0.5 }}>
                  현재 보이는 텍스트 그대로 저장됩니다.
                </Typography>
              </Box>
            )}
            {!hasSpeakerNames && (
              <Box sx={{ 
                mb: 2, 
                p: 1.5, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 2, 
                border: '1px solid #e0e0e0' 
              }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  ℹ️ 이 STT 결과에는 화자 정보가 포함되어 있지 않습니다.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  화자명을 다시 표시하고 싶으시면 화자 라벨링을 다시 진행하시면 됩니다.
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              label="STT 결과"
              value={sttTranscript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              margin="normal"
              multiline
              rows={15}
              placeholder="STT 결과가 여기에 표시됩니다..."
              sx={{ 
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: 1.5
                },
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
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                글자 수: {sttTranscript.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                줄 수: {sttTranscript.split('\n').length}
              </Typography>
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