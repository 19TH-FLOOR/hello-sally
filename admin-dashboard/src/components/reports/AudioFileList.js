import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  CircularProgress, 
  IconButton, 
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  SelectAll as SelectAllIcon,
  CheckBoxOutlineBlank as DeselectIcon,
} from '@mui/icons-material';
import { formatToKoreanDateTime } from '../../utils/dateUtils';
import { formatDuration, formatFileSize } from '../../utils/audioUtils';

export default function AudioFileList({ 
  report, 
  onUpload, 
  onSTTConfig, 
  onSpeakerLabels, 
  onViewSTT, 
  onStartSTT, 
  onMenuClick,
  getSTTStatusText, 
  getSTTStatusColor,
  selectedFileIds = [],
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onBatchSTT
}) {
  const allFiles = report.audio_files || [];

  const hasFiles = allFiles.length > 0;
  const hasSelectedFiles = selectedFileIds.length > 0;
  const allFilesSelected = hasFiles && allFiles.every(file => selectedFileIds.includes(file.id));

  return (
    <Card
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h6"
            sx={{ 
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            음성 파일 ({report.audio_files?.length || 0}개)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasFiles && (
              <>
                {hasSelectedFiles && (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={onBatchSTT}
                    sx={{ 
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                      boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
                      fontSize: '0.875rem',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #ff5252 0%, #d63031 100%)',
                        boxShadow: '0 6px 24px rgba(255, 107, 107, 0.4)',
                      }
                    }}
                  >
                    일괄 STT ({selectedFileIds.length}개)
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={allFilesSelected ? <DeselectIcon /> : <SelectAllIcon />}
                  onClick={allFilesSelected ? onDeselectAll : onSelectAll}
                  sx={{ 
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    }
                  }}
                >
                  {allFilesSelected ? '전체 해제' : '전체 선택'}
                </Button>
              </>
            )}
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={onUpload}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
                }
              }}
            >
              파일 업로드
            </Button>
          </Box>
        </Box>
        
        {hasFiles && hasSelectedFiles && (
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            backgroundColor: 'rgba(255, 107, 107, 0.05)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            borderRadius: 2 
          }}>
            <Typography variant="body2" color="text.secondary">
              💡 {selectedFileIds.length}개 파일이 선택되었습니다. "일괄 STT" 버튼을 클릭하여 동일한 설정으로 STT를 시작할 수 있습니다.
            </Typography>
          </Box>
        )}
        
        {report.audio_files && report.audio_files.length > 0 ? (
          <List sx={{ p: 0 }}>
            {report.audio_files.map((file, index) => {
              const isSelected = selectedFileIds.includes(file.id);
              
              return (
                <Box key={file.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 2,
                      borderRadius: 2,
                      backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.04)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255, 107, 107, 0.2)' : '1px solid transparent',
                      '&:hover': {
                        backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.08)' : 'rgba(102, 126, 234, 0.04)',
                      }
                    }}
                  >
                    <Box sx={{ mr: 1 }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => onFileSelect(file.id, e.target.checked)}
                        size="small"
                        sx={{
                          color: 'rgba(255, 107, 107, 0.6)',
                          '&.Mui-checked': {
                            color: '#ff6b6b',
                          },
                        }}
                      />
                    </Box>
                    
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {file.display_name || file.filename}
                          </Typography>
                          {file.display_name && file.display_name !== file.filename && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                              업로드된 파일명: {file.filename}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                            업로드 일시: {formatToKoreanDateTime(file.uploaded_at)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              ⏱️ {formatDuration(file.duration)}
                            </Typography>
                            {file.file_size && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                📁 {formatFileSize(file.file_size)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              label={`STT: ${getSTTStatusText(file.stt_status)}`}
                              color={getSTTStatusColor(file.stt_status)}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                            {file.stt_status === 'processing' && (
                              <CircularProgress size={16} />
                            )}
                          </Box>
                          
                          {file.stt_status !== 'pending' && (
                            <Button
                              onClick={() => onSTTConfig(file)}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1.5, 
                                py: 0.5, 
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                }
                              }}
                            >
                              STT 설정
                            </Button>
                          )}
                          
                          {file.stt_status === 'completed' && (
                            <>
                              <Button
                                onClick={() => onSpeakerLabels(file)}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: 1.5, 
                                  py: 0.5, 
                                  fontSize: '0.75rem',
                                  borderRadius: 1.5,
                                  borderColor: 'secondary.main',
                                  color: 'secondary.main',
                                  '&:hover': {
                                    backgroundColor: 'rgba(245, 87, 108, 0.04)',
                                  }
                                }}
                              >
                                화자 라벨링
                              </Button>
                              <Button
                                onClick={() => onViewSTT(file)}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: 1.5, 
                                  py: 0.5, 
                                  fontSize: '0.75rem',
                                  borderRadius: 1.5,
                                  borderColor: 'success.main',
                                  color: 'success.main',
                                  '&:hover': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                  }
                                }}
                              >
                                STT 결과 편집
                              </Button>
                            </>
                          )}
                          
                          {file.stt_status === 'pending' && (
                            <Button
                              onClick={() => onSTTConfig(file)}
                              size="small"
                              variant="contained"
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1.5, 
                                py: 0.5, 
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                }
                              }}
                            >
                              STT 시작
                            </Button>
                          )}
                          
                          {file.stt_status === 'failed' && (
                            <Button
                              onClick={() => onStartSTT(file.id)}
                              size="small"
                              variant="outlined"
                              color="error"
                              sx={{ 
                                minWidth: 'auto', 
                                px: 1.5, 
                                py: 0.5, 
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                                '&:hover': {
                                  backgroundColor: 'rgba(244, 67, 54, 0.04)',
                                }
                              }}
                            >
                              STT 재시도
                            </Button>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        onClick={(event) => onMenuClick(event, file)}
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < report.audio_files.length - 1 && (
                    <Divider sx={{ my: 1, opacity: 0.3 }} />
                  )}
                </Box>
              );
            })}
          </List>
        ) : (
          <Box 
            onClick={onUpload}
            sx={{ 
              textAlign: 'center', 
              py: 6,
              color: 'text.secondary',
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              border: '1px dashed rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.04)',
                borderColor: 'rgba(102, 126, 234, 0.3)',
                color: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
              }
            }}
          >
            <UploadIcon sx={{ 
              fontSize: 48, 
              mb: 2, 
              opacity: 0.5,
              transition: 'all 0.2s ease-in-out',
              '.MuiBox-root:hover &': {
                opacity: 0.8,
                transform: 'scale(1.1)',
              }
            }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              업로드된 음성 파일이 없습니다.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              여기를 클릭하거나 상단 버튼을 클릭하여 음성 파일을 추가해보세요.
            </Typography>
            <Typography variant="caption" sx={{ 
              mt: 2, 
              display: 'block',
              opacity: 0.7,
              fontStyle: 'italic'
            }}>
              💡 드래그 앤 드롭으로 여러 파일을 한 번에 업로드할 수 있습니다.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 