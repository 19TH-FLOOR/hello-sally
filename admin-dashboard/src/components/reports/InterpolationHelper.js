import React, { useState, useEffect, useRef } from 'react';
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

export default function InterpolationHelper({ 
  variant = 'full', 
  textFieldRef = null, 
  formData = null,
  onVariablesLoad = null,
  onVariableClick = null,
  currentPositions = {}
}) {
  const [copySuccess, setCopySuccess] = useState({});
  const [interpolationVariables, setInterpolationVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 이벤트 리스너 관리를 위한 ref
  const currentKeyDownHandler = useRef(null);

  // API에서 인터폴레이션 변수 정보 가져오기
  useEffect(() => {
    const fetchInterpolationVariables = async () => {
      try {
        const response = await fetch('/api/ai-prompts-for-report/interpolation/variables');
        if (response.ok) {
          const data = await response.json();
          setInterpolationVariables(data.variables);
          // 외부로 변수 목록 전달
          if (onVariablesLoad) {
            onVariablesLoad(data.variables);
          }
        } else {
          // API 실패 시 기본값 사용
          const defaultVariables = [
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
          ];
          setInterpolationVariables(defaultVariables);
          if (onVariablesLoad) {
            onVariablesLoad(defaultVariables);
          }
        }
      } catch (error) {
        console.error('인터폴레이션 변수 정보 로드 실패:', error);
        // 오류 시 기본값 사용
        const defaultVariables = [
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
        ];
        setInterpolationVariables(defaultVariables);
        if (onVariablesLoad) {
          onVariablesLoad(defaultVariables);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInterpolationVariables();
  }, []);

  useEffect(() => {
    if (onVariablesLoad && interpolationVariables.length > 0) {
      onVariablesLoad(interpolationVariables);
    }
  }, [interpolationVariables, onVariablesLoad]);

  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      if (currentKeyDownHandler.current && textFieldRef?.current) {
        const textField = textFieldRef.current.querySelector('textarea') || textFieldRef.current.querySelector('input');
        if (textField) {
          textField.removeEventListener('keydown', currentKeyDownHandler.current);
        }
      }
    };
  }, [textFieldRef]);

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
    // 복사 기능
    handleCopyVariable(variable);
    
    // 외부에서 전달받은 클릭 핸들러가 있으면 사용
    if (onVariableClick) {
      onVariableClick(variable);
      return;
    }
    
    // 기존 로직 (호환성을 위해 유지)
    if (!textFieldRef || !textFieldRef.current || !formData) {
      return;
    }

    const textField = textFieldRef.current.querySelector('textarea');
    if (!textField) {
      return;
    }

    const positions = findVariablePositions(formData.prompt_content, variable);
    if (positions.length === 0) {
      return;
    }

    // 현재 변수의 위치 인덱스 가져오기 (없으면 0)
    const currentIndex = currentPositions[variable] || 0;
    const nextIndex = (currentIndex + 1) % positions.length;
    
    const moveToPosition = (index) => {
      const position = positions[index];
      textField.focus();
      textField.setSelectionRange(position, position + variable.length);
      
      // 스크롤 위치 계산 및 이동
      const lines = formData.prompt_content.substring(0, position).split('\n');
      const lineNumber = lines.length - 1;
      const lineHeight = 21; // 대략적인 라인 높이 (14px 폰트 * 1.5 라인 높이)
      const scrollTop = Math.max(0, (lineNumber * lineHeight) - (textField.clientHeight / 2));
      
      textField.scrollTop = scrollTop;
    };

    moveToPosition(nextIndex);

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
      toast.success(`${variable} 변수 (${nextIndex + 1}/${positions.length})로 이동했습니다.`, {
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
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
            whiteSpace: 'nowrap',
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
      <Alert 
        severity="info" 
        sx={{ 
          mb: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.2)',
          '& .MuiAlert-icon': {
            color: 'info.main'
          }
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          인터폴레이션 변수 사용법
        </Typography>
        <Typography variant="body2" color="text.secondary">
          프롬프트에서 다음 변수들을 사용하여 실제 데이터로 자동 치환할 수 있습니다. 
          변수를 클릭하면 프롬프트 편집기의 해당 위치로 이동하거나 클립보드에 복사됩니다.
        </Typography>
      </Alert>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.1)', mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: '20%' }}>변수</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '30%' }}>설명</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>타입</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '35%' }}>예시</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '5%' }}>복사</TableCell>
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
                      padding: '4px 8px',
                      borderRadius: 1,
                      display: 'inline-block',
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                  >
                    {item.variable}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
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
                      padding: '6px 8px',
                      borderRadius: 1,
                      display: 'block',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
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
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          변수별 상세 정보
        </Typography>
        {interpolationVariables.map((item) => (
          <Accordion 
            key={item.variable} 
            elevation={0} 
            sx={{ 
              border: '1px solid rgba(0, 0, 0, 0.1)', 
              mb: 2,
              borderRadius: 2,
              '&:before': {
                display: 'none',
              },
              '&.Mui-expanded': {
                margin: '0 0 16px 0',
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '8px 8px 0 0',
                '&.Mui-expanded': {
                  borderRadius: '8px 8px 0 0',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 1,
                    fontSize: '0.9rem'
                  }}
                >
                  {item.variable}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  상세 정보 보기
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  주요 특징:
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {item.notes.map((note, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        backgroundColor: 'primary.main', 
                        mt: 1, 
                        mr: 2,
                        flexShrink: 0
                      }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {note}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  사용 예시:
                </Typography>
                <Box 
                  sx={{ 
                    backgroundColor: 'grey.100',
                    padding: 3,
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    overflow: 'auto',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    lineHeight: 1.5
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
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
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            minHeight: '80vh',
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
            borderRadius: '12px 12px 0 0',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              인터폴레이션 변수 가이드
            </Typography>
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
        <DialogContent sx={{ p: 4, mt: 1 }}>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
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