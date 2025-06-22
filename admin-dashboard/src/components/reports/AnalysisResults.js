import { useState } from 'react';
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
  Paper
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  AccessTime as AccessTimeIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { formatToKoreanDateTime } from '../../utils/dateUtils';

export default function AnalysisResults({ report, latestOnly = false, onToggleLatestOnly }) {
  const [showLatestOnly, setShowLatestOnly] = useState(latestOnly);

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

  // 표시할 데이터 결정 - 최신 순으로 정렬 보장
  const sortedData = [...report.report_data].sort((a, b) => 
    new Date(b.generated_at) - new Date(a.generated_at)
  );
  const displayData = showLatestOnly ? [sortedData[0]] : sortedData;

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
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {showLatestOnly ? '최신 분석 결과' : `분석 결과 #${index + 1}`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatToKoreanDateTime(data.generated_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ pt: 0 }}>
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