import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import AnalysisResults from './AnalysisResults';
import AIAnalysisConfigDialog from './dialogs/AIAnalysisConfigDialog';

const API_BASE_URL = '/api';

export default function AIAnalysisPanel({ report, onReportUpdate }) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const [error, setError] = useState('');
  const [pollInterval, setPollInterval] = useState(null);

  // 컴포넌트 마운트 시 분석 상태 확인
  useEffect(() => {
    if (report?.id) {
      checkAnalysisStatus();
      loadLatestAnalysis();
    }
    
    // cleanup: 컴포넌트 언마운트 시 폴링 정리
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [report?.id, pollInterval]);

  const checkAnalysisStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${report.id}/analysis-status`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisStatus(data);
      }
    } catch (error) {
      console.error('분석 상태 확인 실패:', error);
    }
  };

  const loadLatestAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${report.id}/ai-analysis/latest`);
      if (response.ok) {
        const data = await response.json();
        setLatestAnalysis(data);
      }
    } catch (error) {
      console.error('최신 분석 결과 로드 실패:', error);
    }
  };

  const handleStartAnalysis = (analysisData) => {
    console.log('AI 분석 시작:', analysisData);
    setError('');
    
    // 분석이 시작되면 상태를 분석 중으로 변경
    setAnalysisStatus(prev => ({
      ...prev,
      report_status: 'analyzing'
    }));
    
    // 기존 폴링이 있다면 정리
    if (pollInterval) {
      console.log('기존 폴링 정리');
      clearInterval(pollInterval);
    }
    
    // 분석 완료까지 폴링 시작
    console.log('새로운 폴링 시작');
    const newPollInterval = startPolling();
    setPollInterval(newPollInterval);
  };

  const startPolling = () => {
    console.log('폴링 시작:', report.id);
    let pollCount = 0;
    const maxPolls = 150; // 최대 5분 (2초 * 150 = 300초)
    
    const intervalId = setInterval(async () => {
      try {
        pollCount++;
        console.log(`폴링 ${pollCount}회 실행 중...`);
        
        const [statusResponse, latestResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/reports/${report.id}/analysis-status`),
          fetch(`${API_BASE_URL}/reports/${report.id}/ai-analysis/latest`)
        ]);
        
        if (!statusResponse.ok || !latestResponse.ok) {
          throw new Error('API 응답 오류');
        }
        
        const [statusData, latestData] = await Promise.all([
          statusResponse.json(),
          latestResponse.json()
        ]);
        
        console.log('폴링 결과:', { statusData, latestData });
        
        setAnalysisStatus(statusData);
        setLatestAnalysis(latestData);
        
        // 분석이 완료되면 폴링 중지
        if (statusData?.report_status === 'completed' || 
            statusData?.report_status === 'draft' ||
            pollCount >= maxPolls) {
          console.log('폴링 중지 조건 충족:', statusData?.report_status);
          clearInterval(intervalId);
          setPollInterval(null);
          
          // 보고서 정보 업데이트
          if (onReportUpdate) {
            onReportUpdate();
          }
        }
      } catch (error) {
        console.error('폴링 중 오류:', error);
        clearInterval(intervalId);
        setPollInterval(null);
      }
    }, 2000); // 2초마다 폴링
    
    // interval ID 반환
    return intervalId;
  };



  const isAnalyzing = report?.status === 'analyzing' || analysisStatus?.report_status === 'analyzing';
  const hasAnalysis = latestAnalysis?.has_analysis || (report?.report_data && report.report_data.length > 0);
  
  // 실시간 업데이트된 report 데이터 생성
  const updatedReport = {
    ...report,
    report_data: latestAnalysis?.has_analysis && latestAnalysis?.analysis_data ? 
      [{
        id: Date.now(), // 임시 ID
        analysis_data: latestAnalysis.analysis_data,
        generated_at: latestAnalysis.generated_at,
        ai_prompt_id: latestAnalysis.ai_prompt_id
      }, ...(report?.report_data || [])] : 
      (report?.report_data || [])
  };
  const canAnalyze = report?.status !== 'analyzing' && hasValidSTTResults();

  // STT 결과가 있는지 확인
  function hasValidSTTResults() {
    if (!report?.audio_files) return false;
    return report.audio_files.some(file => 
      file.stt_status === 'completed' && file.stt_transcript
    );
  }

  const getStatusInfo = () => {
    if (isAnalyzing) {
      return {
        icon: <RefreshIcon className="animate-spin" />,
        text: pollInterval ? 'AI 분석 진행 중... (자동 업데이트 중)' : 'AI 분석 진행 중...',
        color: 'warning'
      };
    }
    
    if (hasAnalysis) {
      return {
        icon: <CheckCircleIcon />,
        text: 'AI 분석 완료',
        color: 'success'
      };
    }
    
    if (!hasValidSTTResults()) {
      return {
        icon: <ErrorIcon />,
        text: 'STT 처리가 필요합니다',
        color: 'error'
      };
    }
    
    return {
      icon: <PsychologyIcon />,
      text: 'AI 분석 준비 완료',
      color: 'info'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* AI 분석 제어 패널 */}
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
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
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
              AI 분석
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {canAnalyze && (
                <Button
                  variant="contained"
                  onClick={() => setConfigDialogOpen(true)}
                  disabled={isAnalyzing}
                  startIcon={<PlayArrowIcon />}
                >
                  AI 분석 시작
                </Button>
              )}
            </Box>
          </Box>

          {/* 분석 상태 표시 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.text}
              color={statusInfo.color}
              variant={isAnalyzing ? 'filled' : 'outlined'}
            />
            
            {/* 폴링 상태 표시 */}
            {pollInterval && (
              <Chip
                label="실시간 업데이트 중"
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            
            {analysisStatus?.has_analysis && (
              <Typography variant="caption" color="text.secondary">
                마지막 분석: {new Date(analysisStatus.latest_analysis).toLocaleString()}
              </Typography>
            )}
          </Box>

          {/* 진행률 표시 (분석 중일 때) */}
          {isAnalyzing && (
            <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
          )}

          {/* 오류 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* STT 상태 안내 */}
          {!hasValidSTTResults() && (
            <Alert severity="warning">
              AI 분석을 위해서는 먼저 오디오 파일의 STT 처리가 완료되어야 합니다.
            </Alert>
          )}

          {/* 분석 통계 정보 */}
          {analysisStatus && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  총 분석 횟수
                </Typography>
                <Typography variant="h6">
                  {analysisStatus.analysis_count || 0}회
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  보고서 상태
                </Typography>
                <Typography variant="h6">
                  {getStatusText(report?.status)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* AI 분석 결과 표시 */}
      {hasAnalysis && (
        <AnalysisResults 
          report={updatedReport} 
          latestOnly={true}
          onToggleLatestOnly={(latestOnly) => {
            // 필요시 상태 업데이트
          }}
        />
      )}

      {/* AI 분석 설정 다이얼로그 */}
      <AIAnalysisConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        onStartAnalysis={handleStartAnalysis}
        reportId={report?.id}
      />
    </Box>
  );
}

// 유틸리티 함수
function getStatusText(status) {
  const statusMap = {
    'draft': '초안',
    'analyzing': '분석중',
    'completed': '완료',
    'published': '발행됨'
  };
  return statusMap[status] || status;
} 