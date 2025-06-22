import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export default function InterpolationHelper({ variant = 'full', textFieldRef = null, formData = null }) {
  const [copySuccess, setCopySuccess] = useState({});
  const [interpolationVariables, setInterpolationVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // API에서 인터폴레이션 변수 정보 가져오기
  useEffect(() => {
    const fetchInterpolationVariables = async () => {
      try {
        const response = await fetch('/api/ai-prompts-for-report/interpolation/variables');
        if (response.ok) {
          const data = await response.json();
          setInterpolationVariables(data.variables);
        } else {
          // API 실패 시 기본값 사용
          setInterpolationVariables([
            {
              variable: '{{conversation_content}}',
              description: '모든 오디오 파일의 STT 결과를 결합한 전체 대화 내용',
              type: 'string',
              example: '부모: 안녕하세요\\n아이: 안녕하세요\\n부모: 오늘 뭐 했어?\\n아이: 놀았어요',
              notes: [
                '여러 오디오 파일이 있는 경우 모든 내용이 결합됩니다',
                '파일명은 포함되지 않고 순수 대화 내용만 포함됩니다',
                '화자 구분이 있는 경우 "화자명: 내용" 형태로 표시됩니다'
              ]
            },
            {
              variable: '{{conversation_duration}}',
              description: '모든 오디오 파일의 총 재생 시간 (초 단위)',
              type: 'number',
              example: '180',
              notes: [
                '초 단위의 숫자로 제공됩니다 (예: 180 = 3분)',
                '여러 오디오 파일이 있는 경우 모든 파일의 시간이 합산됩니다',
                '프롬프트에서 분 단위로 변환하거나 조건문에 활용할 수 있습니다'
              ]
            }
          ]);
        }
      } catch (error) {
        console.error('인터폴레이션 변수 정보 로드 실패:', error);
        // 오류 시 기본값 사용
        setInterpolationVariables([
          {
            variable: '{{conversation_content}}',
            description: '모든 오디오 파일의 STT 결과를 결합한 전체 대화 내용',
            type: 'string',
            example: '부모: 안녕하세요\\n아이: 안녕하세요\\n부모: 오늘 뭐 했어?\\n아이: 놀았어요',
            notes: [
              '여러 오디오 파일이 있는 경우 모든 내용이 결합됩니다',
              '파일명은 포함되지 않고 순수 대화 내용만 포함됩니다',
              '화자 구분이 있는 경우 "화자명: 내용" 형태로 표시됩니다'
            ]
          },
          {
            variable: '{{conversation_duration}}',
            description: '모든 오디오 파일의 총 재생 시간 (초 단위)',
            type: 'number',
            example: '180',
            notes: [
              '초 단위의 숫자로 제공됩니다 (예: 180 = 3분)',
              '여러 오디오 파일이 있는 경우 모든 파일의 시간이 합산됩니다',
              '프롬프트에서 분 단위로 변환하거나 조건문에 활용할 수 있습니다'
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterpolationVariables();
  }, []);

  const handleCopyVariable = async (variable) => {
    try {
      await navigator.clipboard.writeText(variable);
      setCopySuccess(prev => ({ ...prev, [variable]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [variable]: false }));
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const findVariablePositions = (text, variable) => {
    const positions = [];
    let index = 0;
    
    while ((index = text.indexOf(variable, index)) !== -1) {
      positions.push(index);
      index += variable.length;
    }
    
    return positions;
  };

  const handleVariableClick = (variable) => {
    if (!textFieldRef?.current || !formData?.prompt_content) {
      // 복사 기능으로 폴백
      handleCopyVariable(variable);
      return;
    }

    const textField = textFieldRef.current.querySelector('textarea') || textFieldRef.current.querySelector('input');
    if (!textField) {
      handleCopyVariable(variable);
      return;
    }

    const positions = findVariablePositions(formData.prompt_content, variable);
    
    if (positions.length === 0) {
      // 변수가 없으면 복사하고 알림
      handleCopyVariable(variable);
      toast.info(`${variable} 변수가 프롬프트에 없습니다.\n클립보드에 복사되었습니다.`, {
        duration: 3000,
        style: {
          background: '#3b82f6',
          color: 'white',
        },
      });
      return;
    }

    // 첫 번째 위치로 이동
    let currentIndex = 0;
    
    const moveToPosition = (index) => {
      const position = positions[index];
      textField.focus();
      textField.setSelectionRange(position, position + variable.length);
      textField.scrollTop = Math.max(0, (position / textField.value.length) * textField.scrollHeight - textField.clientHeight / 2);
    };

    moveToPosition(currentIndex);

    // 성공 알림
    if (positions.length === 1) {
      toast.success(`${variable} 변수로 이동했습니다.`, {
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
    } else {
      // 여러 개가 있으면 다음 위치로 이동할 수 있는 기능
      toast.success(`${variable} 변수 (1/${positions.length})로 이동했습니다.\nCtrl+Enter로 다음 위치로 이동`, {
        duration: 4000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });

      const showNavigationInfo = () => {
        const handleKeyDown = (e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % positions.length;
            moveToPosition(currentIndex);
            toast.success(`${variable} 변수 (${currentIndex + 1}/${positions.length})로 이동했습니다.`, {
              duration: 2000,
              style: {
                background: '#10b981',
                color: 'white',
              },
            });
          } else if (e.key === 'Escape') {
            textField.removeEventListener('keydown', handleKeyDown);
            toast.dismiss();
          }
        };

        textField.addEventListener('keydown', handleKeyDown);
        
        // 10초 후 자동 정리
        setTimeout(() => {
          textField.removeEventListener('keydown', handleKeyDown);
        }, 10000);
      };

      showNavigationInfo();
    }
  };

  const renderCompactView = () => (
    <Alert 
      severity="info" 
      icon={<InfoIcon />}
      sx={{ mb: 2 }}
      action={
        <Button
          size="small"
          startIcon={<HelpIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ 
            color: 'info.main',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          상세보기
        </Button>
      }
    >
      <Typography variant="body2" gutterBottom>
        <strong>사용 가능한 인터폴레이션 변수:</strong>
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {interpolationVariables.map((item) => (
          <Tooltip 
            key={item.variable}
            title={textFieldRef && formData ? 
              `${item.description} (클릭하여 이동/복사)` : 
              `${item.description} (클릭하여 복사)`
            }
            arrow
          >
            <Chip
              label={item.variable}
              size="small"
              variant="outlined"
              color="primary"
              icon={<CodeIcon />}
              onClick={() => handleVariableClick(item.variable)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Alert>
  );

  const renderDialogContent = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        프롬프트에서 다음 변수들을 사용하여 실제 데이터로 자동 치환할 수 있습니다.
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.1)', mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>변수</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>타입</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>예시</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 60 }}>복사</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {interpolationVariables.map((item) => (
              <TableRow key={item.variable} hover>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      backgroundColor: 'grey.100',
                      padding: '2px 6px',
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {item.variable}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {item.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.type} 
                    size="small" 
                    variant="outlined"
                    color={item.type === 'string' ? 'success' : 'info'}
                  />
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace',
                      backgroundColor: 'grey.50',
                      padding: '2px 4px',
                      borderRadius: 1,
                      display: 'block',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.example}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={textFieldRef && formData ? "변수 위치로 이동/복사" : "변수 복사"}>
                    <IconButton
                      size="small"
                      onClick={() => handleVariableClick(item.variable)}
                      color={copySuccess[item.variable] ? 'success' : 'default'}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 상세 정보 */}
      <Box>
        {interpolationVariables.map((item) => (
          <Accordion key={item.variable} elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.1)', mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {item.variable} 상세 정보
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>주요 특징:</strong>
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {item.notes.map((note, index) => (
                    <li key={index}>
                      <Typography variant="body2" color="text.secondary">
                        {note}
                      </Typography>
                    </li>
                  ))}
                </ul>
                
                <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                  <strong>사용 예시:</strong>
                </Typography>
                <Box 
                  sx={{ 
                    backgroundColor: 'grey.100',
                    padding: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflow: 'auto'
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {item.variable === '{{conversation_content}}' ? 
                      `다음 대화를 분석해주세요:\n\n${item.variable}\n\n위 대화에서 주요 키워드를 추출해주세요.` :
                      `대화 시간: ${item.variable}초\n\n{# 조건문 예시 #}\n{% if ${item.variable} > 300 %}\n긴 대화입니다.\n{% else %}\n짧은 대화입니다.\n{% endif %}`
                    }
                  </pre>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );

  const renderFullView = () => (
    <Card 
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        mb: 3
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}
        >
          <CodeIcon />
          인터폴레이션 변수 가이드
        </Typography>
        
        {renderDialogContent()}
      </CardContent>
    </Card>
  );

  if (loading) {
    return variant === 'compact' ? (
      <Alert severity="info" sx={{ mb: 2 }}>
        인터폴레이션 변수 정보를 불러오는 중...
      </Alert>
    ) : (
      <Card elevation={0} sx={{ mb: 3, p: 3 }}>
        <Typography>인터폴레이션 변수 정보를 불러오는 중...</Typography>
      </Card>
    );
  }

  return (
    <>
      {variant === 'compact' ? renderCompactView() : renderFullView()}
      
      {/* 상세 정보 다이얼로그 */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon />
            인터폴레이션 변수 가이드
          </Box>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 