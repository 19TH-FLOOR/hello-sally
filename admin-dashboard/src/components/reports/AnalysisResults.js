import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Grid,
  Paper,
  Collapse,
  IconButton
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  AccessTime as AccessTimeIcon,
  SmartToy as SmartToyIcon,
  ContentCopy as ContentCopyIcon,
  Article as ArticleIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreSmallIcon
} from '@mui/icons-material';
import { formatToKoreanDateTime } from '../../utils/dateUtils';

const API_BASE_URL = '/api';

export default function AnalysisResults({ report, latestOnly = false, onToggleLatestOnly }) {
  const [showLatestOnly, setShowLatestOnly] = useState(latestOnly);
  const [copySuccess, setCopySuccess] = useState({});
  const [promptDetails, setPromptDetails] = useState({});
  const [showPrompts, setShowPrompts] = useState({});

  if (!report.report_data || report.report_data.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            아직 AI 분석 결과가 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            AI 분석을 실행하여 결과를 확인해보세요.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleToggleLatestOnly = () => {
    const newValue = !showLatestOnly;
    setShowLatestOnly(newValue);
    if (onToggleLatestOnly) {
      onToggleLatestOnly(newValue);
    }
  };

  // 프롬프트 정보 로드
  useEffect(() => {
    const loadPromptDetails = async () => {
      const uniquePromptIds = [...new Set(
        report.report_data
          ?.filter(data => data.ai_prompt_id)
          .map(data => data.ai_prompt_id) || []
      )];

      for (const promptId of uniquePromptIds) {
        if (!promptDetails[promptId]) {
          try {
            const response = await fetch(`${API_BASE_URL}/ai-prompts-for-report/${promptId}`);
            if (response.ok) {
              const promptData = await response.json();
              setPromptDetails(prev => ({
                ...prev,
                [promptId]: promptData
              }));
            }
          } catch (error) {
            console.error(`프롬프트 ${promptId} 로드 실패:`, error);
          }
        }
      }
    };

    if (report.report_data && report.report_data.length > 0) {
      loadPromptDetails();
    }
  }, [report.report_data]);

  // 표시할 데이터 결정 - 최신 순으로 정렬 보장
  const sortedData = [...report.report_data].sort((a, b) => 
    new Date(b.generated_at) - new Date(a.generated_at)
  );
  const displayData = showLatestOnly ? [sortedData[0]] : sortedData;

  // 복사 기능
  const handleCopyToClipboard = async (data, dataId) => {
    let textToCopy = '';
    
    try {
      if (data.original_json) {
        // 원본 JSON이 있는 경우 그것을 사용
        textToCopy = data.original_json;
      } else if (data.parsed_data) {
        // 파싱된 데이터가 있는 경우
        textToCopy = JSON.stringify(data.parsed_data, null, 2);
      } else {
        // 메타데이터 제외하고 복사
        const { _metadata, ...copyData } = data;
        textToCopy = JSON.stringify(copyData, null, 2);
      }
      
      await navigator.clipboard.writeText(textToCopy);
      
      // 성공 상태 표시
      setCopySuccess(prev => ({ ...prev, [dataId]: true }));
      
      // 2초 후 성공 상태 초기화
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [dataId]: false }));
      }, 2000);
      
    } catch (error) {
      console.error('복사 실패:', error);
      
      try {
        // 폴백: 텍스트 선택 방식
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopySuccess(prev => ({ ...prev, [dataId]: true }));
        setTimeout(() => {
          setCopySuccess(prev => ({ ...prev, [dataId]: false }));
        }, 2000);
      } catch (fallbackError) {
        console.error('폴백 복사도 실패:', fallbackError);
      }
    }
  };

  const renderJSONContent = (data) => {
    try {
      // 메타데이터가 있으면 분리해서 표시
      if (data._metadata) {
        const { _metadata } = data;
        
        // 순서가 유지된 원본 JSON 사용
        const jsonToDisplay = data.original_json || 
                             (data.parsed_data ? JSON.stringify(data.parsed_data, null, 2) : 
                              JSON.stringify(data, null, 2));
        
        return (
          <Box>
            {/* 메타데이터 표시 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                분석 정보
              </Typography>
              <Grid container spacing={1}>
                <Grid item>
                  <Chip 
                    icon={<SmartToyIcon />}
                    label={_metadata.model_used || '알 수 없음'} 
                    size="small" 
                    color="primary"
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label={`${_metadata.total_files || 0}개 파일`} 
                    size="small" 
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label={`${_metadata.total_duration || 0}초`} 
                    size="small" 
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* JSON 데이터 표시 - 순서 유지된 원본 JSON 사용 */}
            <Box
              sx={{
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '400px',
                overflow: 'auto',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                margin: 0,
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}>
                {typeof jsonToDisplay === 'string' ? 
                  // 이미 포맷된 JSON 문자열인 경우 그대로 사용
                  jsonToDisplay : 
                  // 객체인 경우 포맷팅
                  JSON.stringify(jsonToDisplay, null, 2)
                }
              </pre>
            </Box>
          </Box>
        );
      } else {
        // 메타데이터가 없는 경우 기존 방식
        return (
          <Box
            sx={{
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              p: 2,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '400px',
              overflow: 'auto',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              margin: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Box>
        );
      }
    } catch (error) {
      return (
        <Typography variant="body2" color="error">
          JSON 데이터를 표시할 수 없습니다.
        </Typography>
      );
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <PsychologyIcon />
            AI 분석 결과
          </Typography>
          
          {sortedData.length > 1 && (
            <FormControlLabel
              control={
                <Switch
                  checked={showLatestOnly}
                  onChange={handleToggleLatestOnly}
                  size="small"
                />
              }
              label={
                <Typography variant="caption">
                  최신 결과만 표시
                </Typography>
              }
            />
          )}
        </Box>
        
        {displayData.map((data, index) => (
          <Accordion 
            key={data.id}
            defaultExpanded={index === 0}
            elevation={0}
            sx={{
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              mb: 2,
              '&:before': {
                display: 'none',
              },
              '&:last-child': {
                mb: 0,
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {showLatestOnly ? '최신 분석 결과' : `분석 결과 #${index + 1}`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatToKoreanDateTime(data.generated_at)}
                      </Typography>
                    </Box>
                    {/* 프롬프트 정보 */}
                    {data.ai_prompt_id && promptDetails[data.ai_prompt_id] && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArticleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                          {promptDetails[data.ai_prompt_id].name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                {/* 복사 버튼 */}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation(); // Accordion 확장/축소 방지
                    handleCopyToClipboard(data.analysis_data, data.id);
                  }}
                  sx={{ 
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.75rem'
                  }}
                >
                  {copySuccess[data.id] ? '복사됨!' : '복사'}
                </Button>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ pt: 0 }}>
              {/* 프롬프트 상세 정보 */}
              {data.ai_prompt_id && promptDetails[data.ai_prompt_id] && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<ArticleIcon />}
                      endIcon={showPrompts[data.id] ? <ExpandLessIcon /> : <ExpandMoreSmallIcon />}
                      onClick={() => setShowPrompts(prev => ({
                        ...prev,
                        [data.id]: !prev[data.id]
                      }))}
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        p: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        }
                      }}
                    >
                      사용된 프롬프트 {showPrompts[data.id] ? '숨기기' : '보기'}
                    </Button>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item>
                        <Chip 
                          label={promptDetails[data.ai_prompt_id].name}
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Collapse in={showPrompts[data.id]}>
                    <Box
                      sx={{
                        background: 'rgba(102, 126, 234, 0.04)',
                        borderRadius: 2,
                        p: 2,
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
                        프롬프트 내용:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          lineHeight: 1.4
                        }}
                      >
                        {promptDetails[data.ai_prompt_id].prompt_content}
                      </Typography>
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* 분석 결과 */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                AI 분석 결과
              </Typography>
              {renderJSONContent(data.analysis_data)}
            </AccordionDetails>
          </Accordion>
        ))}

        {showLatestOnly && sortedData.length > 1 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
                              총 {sortedData.length}개의 분석 결과가 있습니다.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 