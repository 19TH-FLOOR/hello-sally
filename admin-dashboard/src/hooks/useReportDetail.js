import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// API 요청은 Next.js 프록시(/api)를 통해 처리
const API_BASE_URL = '/api';

export const useReportDetail = (reportId) => {
  // 기본 상태
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  
  // 다이얼로그 상태
  const [dialogStates, setDialogStates] = useState({
    editReport: false,
    fileUpload: false,
    sttConfig: false,
    sttEdit: false,
    speakerLabel: false,
    editFileName: false
  });
  
  // 선택된 파일
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  
  // STT 폴링 상태
  const [pollingIntervalId, setPollingIntervalId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [notifiedFiles, setNotifiedFiles] = useState(new Set());

  // 다이얼로그 열기/닫기 함수
  const openDialog = useCallback((dialogName) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: true }));
  }, []);

  const closeDialog = useCallback((dialogName) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: false }));
    // 다이얼로그 닫을 때 선택된 파일도 초기화
    if (['sttConfig', 'sttEdit', 'speakerLabel', 'editFileName'].includes(dialogName)) {
      setSelectedAudioFile(null);
    }
  }, []);

  // 보고서 상세 정보 조회
  const fetchReportDetail = useCallback(async () => {
    if (!reportId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
      if (!response.ok) throw new Error('보고서를 불러올 수 없습니다.');
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  // 분석 상태 조회
  const fetchAnalysisStatus = useCallback(async () => {
    if (!reportId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/analysis-status`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisStatus(data);
      }
    } catch (err) {
      console.error('분석 상태 조회 실패:', err);
    }
  }, [reportId]);

  // STT 폴링 중단
  const stopSTTPolling = useCallback(() => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setIsPolling(false);
    setNotifiedFiles(new Set());
  }, [pollingIntervalId]);

  // STT 폴링 시작
  const startSTTPolling = useCallback(() => {
    if (isPolling || pollingIntervalId) return;
    
    setIsPolling(true);
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const audioFiles = data.audio_files || [];
        
        setReport(prevReport => {
          const prevAudioFiles = prevReport?.audio_files || [];
          
          // STT 완료/실패 알림 처리
          const newlyCompletedFiles = audioFiles.filter(file => {
            const prevFile = prevAudioFiles.find(pf => pf.id === file.id);
            return prevFile && 
                   (prevFile.stt_status === 'processing' || prevFile.stt_status === 'pending') && 
                   file.stt_status === 'completed' &&
                   !notifiedFiles.has(`${file.id}-completed`);
          });
          
          const newlyFailedFiles = audioFiles.filter(file => {
            const prevFile = prevAudioFiles.find(pf => pf.id === file.id);
            return prevFile && 
                   (prevFile.stt_status === 'processing' || prevFile.stt_status === 'pending') && 
                   file.stt_status === 'failed' &&
                   !notifiedFiles.has(`${file.id}-failed`);
          });
          
          // 알림 처리
          if (newlyCompletedFiles.length > 0) {
            newlyCompletedFiles.forEach(file => {
              toast.success(`"${file.display_name || file.filename}" STT 처리가 완료되었습니다.`);
            });
            setNotifiedFiles(prev => {
              const newSet = new Set(prev);
              newlyCompletedFiles.forEach(file => newSet.add(`${file.id}-completed`));
              return newSet;
            });
          }
          
          if (newlyFailedFiles.length > 0) {
            newlyFailedFiles.forEach(file => {
              toast.error(`"${file.display_name || file.filename}" STT 처리가 실패했습니다.`);
            });
            setNotifiedFiles(prev => {
              const newSet = new Set(prev);
              newlyFailedFiles.forEach(file => newSet.add(`${file.id}-failed`));
              return newSet;
            });
          }
          
          return { ...prevReport, audio_files: audioFiles };
        });
        
        // 진행 중인 STT가 없으면 폴링 중단
        const hasProcessingSTT = audioFiles.some(file => 
          file.stt_status === 'processing' || file.stt_status === 'pending'
        );
        
        console.log(`🔍 STT 상태 체크: 진행중인 파일 ${hasProcessingSTT ? '있음' : '없음'} (총 ${audioFiles.length}개 파일)`);
        
        if (!hasProcessingSTT) {
          console.log('⏹️ 진행중인 STT가 없어서 폴링을 중단합니다.');
          stopSTTPolling();
        }
        
      } catch (error) {
        console.error('STT 상태 폴링 오류:', error);
      }
    }, 3000);
    
    setPollingIntervalId(intervalId);
  }, [reportId, isPolling, pollingIntervalId, notifiedFiles, stopSTTPolling]);

  // STT 상태 확인 및 폴링 관리는 이제 useEffect에서 직접 처리

  // 초기 데이터 로드
  useEffect(() => {
    if (reportId) {
      fetchReportDetail();
      fetchAnalysisStatus();
    }
  }, [reportId, fetchReportDetail, fetchAnalysisStatus]);
  
  // 보고서 데이터 로드 후 STT 상태 확인 (조건부 폴링)
  useEffect(() => {
    console.log('📋 STT 폴링 상태 체크:', {
      reportId,
      hasAudioFiles: !!report?.audio_files,
      audioFilesCount: report?.audio_files?.length || 0,
      isPolling
    });
    
    // 보고서 데이터가 있고, 현재 폴링 중이 아닐 때만 체크
    if (report?.audio_files && !isPolling) {
      const processingFiles = report.audio_files.filter(file => 
        file.stt_status === 'processing'
      );
      
      console.log('🔍 진행중인 STT 파일:', processingFiles.length, '개');
      processingFiles.forEach(file => {
        console.log(`  - ${file.display_name || file.filename}: ${file.stt_status}`);
      });
      
      if (processingFiles.length > 0) {
        console.log('🚀 진행중인 STT가 있어서 폴링을 시작합니다.');
        startSTTPolling();
      } else {
        console.log('💤 진행중인 STT가 없어서 폴링하지 않습니다.');
      }
    }
  }, [report?.audio_files, isPolling, startSTTPolling]); // audio_files 배열 자체를 의존성으로

  // 기존 폴링 관리 로직은 위의 useEffect로 대체됨

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      stopSTTPolling();
    };
  }, [stopSTTPolling]);

  return {
    // 상태
    report,
    loading,
    error,
    analysisStatus,
    dialogStates,
    selectedAudioFile,
    isPolling,
    
    // 액션
    setReport,
    setError,
    openDialog,
    closeDialog,
    setSelectedAudioFile,
    fetchReportDetail,
    fetchAnalysisStatus,
    startSTTPolling,
    stopSTTPolling
  };
}; 