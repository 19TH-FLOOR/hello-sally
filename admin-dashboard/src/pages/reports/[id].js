import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Box,
  Grid,
  Alert,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';
import { formatToKoreanDateTime } from '../../utils/dateUtils';

// 커스텀 훅
import { useReportDetail } from '../../hooks/useReportDetail';
import { useReportActions } from '../../hooks/useReportActions';

// 분리된 컴포넌트들
import ReportHeader from '../../components/reports/ReportHeader';
import ReportBasicInfo from '../../components/reports/ReportBasicInfo';
import AudioFileList from '../../components/reports/AudioFileList';
import AnalysisResults from '../../components/reports/AnalysisResults';
import AIAnalysisPanel from '../../components/reports/AIAnalysisPanel';

// 다이얼로그 컴포넌트들
import {
  EditReportDialog,
  FileUploadDialog,
  STTConfigDialog,
  STTEditDialog,
  SpeakerLabelDialog,
  EditFileNameDialog
} from '../../components/reports/dialogs';

// API 요청은 Next.js 프록시(/api)를 통해 처리
const API_BASE_URL = '/api';

// 유틸리티 함수들
const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    analyzing: 'warning',
    completed: 'info'
  };
  return colors[status] || 'default';
};

const getStatusText = (status) => {
  const texts = {
    draft: '초안',
    analyzing: '분석중',
    completed: '완료'
  };
  return texts[status] || status;
};

const getSTTStatusText = (status) => {
  const texts = {
    pending: '대기중',
    processing: '처리중',
    completed: '완료',
    failed: '실패'
  };
  return texts[status] || status;
};

const getSTTStatusColor = (status) => {
  const colors = {
    pending: 'default',
    processing: 'warning',
    completed: 'success',
    failed: 'error'
  };
  return colors[status] || 'default';
};

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  // 커스텀 훅 사용
  const {
    report,
    loading,
    error,
    analysisStatus,
    dialogStates,
    selectedAudioFile,
    isPolling,
    setError,
    openDialog,
    closeDialog,
    setSelectedAudioFile,
    fetchReportDetail,
    startSTTPolling
  } = useReportDetail(id);

  const actions = useReportActions(id, fetchReportDetail, startSTTPolling);

  // 로컬 상태
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    parent_name: '',
    child_name: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // 일괄 STT 관련 상태 추가
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // STT 설정 상태 추가
  const [sttConfig, setSttConfig] = useState({
    model_type: 'sommers',
    language: 'ko',
    domain: 'GENERAL',
    speaker_diarization: true,
    spk_count: null,  // 자동 감지
    profanity_filter: false,
    use_disfluency_filter: true,
    use_paragraph_splitter: false,
    paragraph_max_length: null,
    keywords: []
  });
  const [sttLoading, setSttLoading] = useState(false);

  // 화자 라벨링 상태 추가
  const [speakerLabels, setSpeakerLabels] = useState([]);
  const [speakerNames, setSpeakerNames] = useState({});
  const [speakerTranscript, setSpeakerTranscript] = useState('');

  // STT 편집 상태 추가
  const [sttTranscript, setSttTranscript] = useState('');
  const [originalSttContent, setOriginalSttContent] = useState('');
  const [showSpeakerNamesInEdit, setShowSpeakerNamesInEdit] = useState(true);
  const [hasSpeakerNames, setHasSpeakerNames] = useState(false);

  // 파일명 편집 상태 추가
  const [editingFileName, setEditingFileName] = useState('');

  // 보고서 데이터가 로드되면 폼 데이터 초기화
  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title || '',
        parent_name: report.parent_name || '',
        child_name: report.child_name || ''
      });
    }
  }, [report]);

  // 일괄 STT 관련 핸들러들
  const handleFileSelect = (fileId, checked) => {
    if (checked) {
      setSelectedFileIds(prev => [...prev, fileId]);
    } else {
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = () => {
    const allFiles = report.audio_files || [];
    setSelectedFileIds(allFiles.map(file => file.id));
  };

  const handleDeselectAll = () => {
    setSelectedFileIds([]);
  };

  const handleBatchSTT = () => {
    setIsBatchMode(true);
    // 기본 설정으로 초기화
    setSttConfig({
      model_type: 'sommers',
      language: 'ko',
      domain: 'GENERAL',
      speaker_diarization: true,
      spk_count: null,  // 자동 감지
      profanity_filter: false,
      use_disfluency_filter: true,
      use_paragraph_splitter: false,
      paragraph_max_length: null,
      keywords: []
    });
    openDialog('sttConfig');
  };

  const handleBatchSTTStart = async () => {
    if (selectedFileIds.length === 0) return;
    
    setSttLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // 각 파일에 대해 순차적으로 STT 시작
      for (const fileId of selectedFileIds) {
        try {
          const success = await actions.restartSTT(fileId, sttConfig);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
          // 각 요청 사이에 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`파일 ${fileId} STT 시작 실패:`, error);
          failCount++;
        }
      }

      // 결과 메시지 표시
      if (successCount > 0 && failCount === 0) {
        toast.success(`일괄 STT가 시작되었습니다. (${successCount}개 파일)`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`일부 파일의 STT가 시작되었습니다. (성공: ${successCount}개, 실패: ${failCount}개)`);
      } else {
        toast.error('일괄 STT 시작에 실패했습니다.');
      }

      // 성공한 경우 선택 해제 및 다이얼로그 닫기
      if (successCount > 0) {
        setSelectedFileIds([]);
        setIsBatchMode(false);
        closeDialog('sttConfig');
      }
    } catch (error) {
      console.error('일괄 STT 처리 중 오류:', error);
      toast.error('일괄 STT 처리 중 오류가 발생했습니다.');
    } finally {
      setSttLoading(false);
    }
  };

  // 보고서 수정 핸들러
  const handleUpdateReport = async () => {
    setFormLoading(true);
    const success = await actions.updateReport(formData);
    setFormLoading(false);
    if (success) {
      closeDialog('editReport');
    }
  };

  // 케밥 메뉴 핸들러들
  const handleMenuClick = (event, file) => {
    setAnchorEl(event.currentTarget);
    setSelectedFileForMenu(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFileForMenu(null);
  };

  // 파일 다운로드 핸들러
  const handleDownloadFile = async (file) => {
    try {
      // 다운로드 시작 알림
      toast.loading('다운로드 URL을 생성 중입니다...', { id: 'download' });
      
      // 다운로드 URL 요청
      const response = await fetch(`${API_BASE_URL}/audio-files/${file.id}/download-url`);
      
      if (!response.ok) {
        throw new Error('다운로드 URL 생성에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 다운로드 시작
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('파일 다운로드가 시작되었습니다.', { id: 'download' });
    } catch (error) {
      console.error('다운로드 실패:', error);
      toast.error('파일 다운로드에 실패했습니다.', { id: 'download' });
    }
  };

  const handleMenuAction = (action) => {
    if (!selectedFileForMenu) return;
    
    switch (action) {
      case 'download':
        handleDownloadFile(selectedFileForMenu);
        break;
      case 'editName':
        setSelectedAudioFile(selectedFileForMenu);
        setEditingFileName(selectedFileForMenu.display_name || selectedFileForMenu.filename);
        openDialog('editFileName');
        break;
      case 'delete':
        actions.deleteAudioFile(selectedFileForMenu.id, selectedFileForMenu.filename);
        break;
    }
    handleMenuClose();
  };

  // 파일명 저장 핸들러
  const handleSaveFileName = async () => {
    if (!selectedAudioFile || !editingFileName.trim()) return;
    
    setSttLoading(true);
    const success = await actions.updateFileName(selectedAudioFile.id, editingFileName);
    setSttLoading(false);
    
    if (success) {
      closeDialog('editFileName');
      setEditingFileName('');
    }
  };

  // STT 관련 핸들러들
  const handleViewSTT = async (file) => {
    setSelectedAudioFile(file);
    setSttLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${file.id}/transcript`);
      if (!response.ok) throw new Error('STT 결과를 불러올 수 없습니다.');
      
      const data = await response.json();
      const content = data.stt_transcript || '';
      
      // 화자명 존재 여부 확인
      const hasSpeakers = checkHasSpeakerNames(content);
      setHasSpeakerNames(hasSpeakers);
      
      // 원본 내용 저장
      setOriginalSttContent(content);
      setSttTranscript(content);
      setShowSpeakerNamesInEdit(true);
      
      openDialog('sttEdit');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSttLoading(false);
    }
  };

  const handleOpenSTTConfig = async (file) => {
    setIsBatchMode(false); // 단일 파일 모드로 설정
    setSelectedAudioFile(file);
    setSttLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${file.id}/stt-config`);
      if (response.ok) {
        const data = await response.json();
        setSttConfig(data);
      }
    } catch (err) {
      console.error('STT 설정 로드 실패:', err);
      // 기본값으로 설정
      setSttConfig({
        model_type: 'sommers',
        language: 'ko',
        domain: 'GENERAL',
        speaker_diarization: true,
        spk_count: null,  // 자동 감지
        profanity_filter: false,
        use_disfluency_filter: true,
        use_paragraph_splitter: false,
        paragraph_max_length: null,
        keywords: []
      });
    } finally {
      setSttLoading(false);
    }
    
    openDialog('sttConfig');
  };

  const handleOpenSpeakerLabels = async (file) => {
    setSelectedAudioFile(file);
    setSttLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${file.id}/transcript/speakers`);
      if (response.ok) {
        const data = await response.json();
        setSpeakerLabels(data.speaker_labels || []);
        setSpeakerNames(data.speaker_names || {});
        setSpeakerTranscript(data.transcript_content || '');
      } else {
        // 화자 정보가 없는 경우 기본값 설정
        setSpeakerLabels([]);
        setSpeakerNames({});
        setSpeakerTranscript('');
        toast.error('화자 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('화자 라벨링 데이터 로드 실패:', err);
      setSpeakerLabels([]);
      setSpeakerNames({});
      setSpeakerTranscript('');
      toast.error('화자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setSttLoading(false);
    }
    
    openDialog('speakerLabel');
  };

  // STT 설정 저장 핸들러
  const handleSaveSTTConfig = async () => {
    if (!selectedAudioFile) return;
    
    setSttLoading(true);
    const success = await actions.saveSTTConfig(selectedAudioFile.id, sttConfig);
    setSttLoading(false);
    
    if (success) {
      closeDialog('sttConfig');
    }
  };

  // STT 재시작 핸들러 (단일/일괄 모드 모두 처리)
  const handleRestartSTT = async () => {
    if (isBatchMode) {
      await handleBatchSTTStart();
    } else if (selectedAudioFile) {
      setSttLoading(true);
      const success = await actions.restartSTT(selectedAudioFile.id, sttConfig);
      setSttLoading(false);
      
      if (success) {
        closeDialog('sttConfig');
      }
    }
  };

  // 화자 이름 변경 핸들러
  const handleSpeakerNameChange = (speaker, name) => {
    const updatedNames = { ...speakerNames, [speaker]: name };
    setSpeakerNames(updatedNames);
    
    // 미리보기 업데이트
    if (speakerLabels && speakerLabels.length > 0) {
      const updatedContentParts = [];
      for (const label of speakerLabels) {
        const labelSpeaker = label.speaker || "";
        const text = label.text || "";
        if (labelSpeaker && text) {
          const newSpeakerName = updatedNames[labelSpeaker] || labelSpeaker;
          updatedContentParts.push(`${newSpeakerName}: ${text}`);
        } else if (text) {
          updatedContentParts.push(text);
        }
      }
      setSpeakerTranscript(updatedContentParts.join("\n"));
    }
  };

  // 화자 라벨링 저장 핸들러
  const handleSaveSpeakerLabels = async () => {
    if (!selectedAudioFile) return;
    
    setSttLoading(true);
    const success = await actions.updateSpeakerLabels(selectedAudioFile.id, speakerNames);
    setSttLoading(false);
    
    if (success) {
      closeDialog('speakerLabel');
    }
  };

  // STT 편집 관련 유틸리티 함수들
  const checkHasSpeakerNames = (text) => {
    if (!text) return false;
    // 한글 완성형(가-힣), 한글 자모(ㄱ-ㅎㅏ-ㅣ), 영문, 숫자, 공백, 하이픈, 언더스코어를 포함
    return /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s\-_]+:\s*/m.test(text);
  };

  const removeSpeakerNamesFromSTT = (text) => {
    if (!text) return '';
    // 한글 완성형(가-힣), 한글 자모(ㄱ-ㅎㅏ-ㅣ), 영문, 숫자, 공백, 하이픈, 언더스코어를 포함
    return text.replace(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s\-_]+:\s*/gm, '').trim();
  };

  const handleToggleSpeakerNames = (show) => {
    setShowSpeakerNamesInEdit(show);
    if (show) {
      setSttTranscript(originalSttContent);
      toast.success('화자명이 표시됩니다.');
    } else {
      const contentWithoutSpeakers = removeSpeakerNamesFromSTT(originalSttContent);
      setSttTranscript(contentWithoutSpeakers);
      toast.success('화자명이 숨겨집니다.');
    }
  };

  // STT 편집 저장 핸들러
  const handleSaveSTTEdit = async () => {
    if (!selectedAudioFile) return;
    
    setSttLoading(true);
    const success = await actions.updateSTT(selectedAudioFile.id, sttTranscript);
    setSttLoading(false);
    
    if (success) {
      closeDialog('sttEdit');
      // 상태 초기화
      setSttTranscript('');
      setOriginalSttContent('');
      setShowSpeakerNamesInEdit(true);
      setHasSpeakerNames(false);
    }
  };

  // 다이얼로그 닫기 핸들러 (상태 초기화)
  const handleCloseSTTConfig = () => {
    closeDialog('sttConfig');
    setIsBatchMode(false);
    setSelectedFileIds([]);
  };

  // 로딩 상태
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button component={Link} href="/reports" startIcon={<ArrowBackIcon />}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 보고서가 없는 경우
  if (!report) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>보고서를 찾을 수 없습니다.</Typography>
        <Button component={Link} href="/reports" startIcon={<ArrowBackIcon />}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 일괄 STT를 위한 선택된 파일들 정보
  const selectedAudioFiles = report.audio_files?.filter(file => 
    selectedFileIds.includes(file.id)
  ) || [];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* 헤더 섹션 */}
      <ReportHeader
        report={report}
        isPolling={isPolling}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 기본 정보 */}
        <Grid item xs={12} md={4}>
          <ReportBasicInfo 
            report={report}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            onEdit={() => openDialog('editReport')}
          />
        </Grid>

        {/* 음성 파일 목록 */}
        <Grid item xs={12} md={8}>
          <AudioFileList
            report={report}
            onUpload={() => openDialog('fileUpload')}
            onSTTConfig={handleOpenSTTConfig}
            onSpeakerLabels={handleOpenSpeakerLabels}
            onViewSTT={handleViewSTT}
            onStartSTT={actions.startSTT}
            onMenuClick={handleMenuClick}
            getSTTStatusText={getSTTStatusText}
            getSTTStatusColor={getSTTStatusColor}
            // 일괄 STT 관련 props 추가
            selectedFileIds={selectedFileIds}
            onFileSelect={handleFileSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBatchSTT={handleBatchSTT}
          />
        </Grid>

        {/* AI 분석 패널 (설정 + 결과) */}
        <Grid item xs={12}>
          <AIAnalysisPanel 
            report={report} 
            onReportUpdate={fetchReportDetail}
          />
        </Grid>
      </Grid>

      {/* 케밥 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleMenuAction('download')}>
          다운로드
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('editName')}>
          파일명 편집
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          삭제
        </MenuItem>
      </Menu>

      {/* 다이얼로그들 */}
      <EditReportDialog
        open={dialogStates.editReport}
        onClose={() => closeDialog('editReport')}
        formData={formData}
        onChange={setFormData}
        onSave={handleUpdateReport}
        loading={formLoading}
      />

      <FileUploadDialog
        open={dialogStates.fileUpload}
        onClose={() => {
          closeDialog('fileUpload');
          // 다이얼로그가 완전히 닫힌 후 새로고침
          setTimeout(() => {
            fetchReportDetail();
          }, 300);
        }}
        onUpload={actions.uploadFile}
      />

      <STTConfigDialog
        open={dialogStates.sttConfig}
        onClose={handleCloseSTTConfig}
        selectedAudioFile={selectedAudioFile}
        selectedAudioFiles={selectedAudioFiles}
        sttConfig={sttConfig}
        setSttConfig={setSttConfig}
        onSave={handleSaveSTTConfig}
        onRestart={handleRestartSTT}
        loading={sttLoading}
        isBatchMode={isBatchMode}
        getSTTStatusText={getSTTStatusText}
        getSTTStatusColor={getSTTStatusColor}
      />

      <STTEditDialog
        open={dialogStates.sttEdit}
        onClose={() => closeDialog('sttEdit')}
        selectedAudioFile={selectedAudioFile}
        sttTranscript={sttTranscript}
        onTranscriptChange={setSttTranscript}
        onSave={handleSaveSTTEdit}
        showSpeakerNamesInEdit={showSpeakerNamesInEdit}
        onToggleSpeakerNames={handleToggleSpeakerNames}
        hasSpeakerNames={hasSpeakerNames}
        loading={sttLoading}
      />

      <SpeakerLabelDialog
        open={dialogStates.speakerLabel}
        onClose={() => closeDialog('speakerLabel')}
        selectedAudioFile={selectedAudioFile}
        speakerLabels={speakerLabels}
        speakerNames={speakerNames}
        onSpeakerNameChange={handleSpeakerNameChange}
        speakerTranscript={speakerTranscript}
        onSave={handleSaveSpeakerLabels}
        loading={sttLoading}
      />

      <EditFileNameDialog
        open={dialogStates.editFileName}
        onClose={() => closeDialog('editFileName')}
        editingFileName={editingFileName}
        onFileNameChange={setEditingFileName}
        onSave={handleSaveFileName}
        loading={sttLoading}
      />
    </Box>
  );
}
