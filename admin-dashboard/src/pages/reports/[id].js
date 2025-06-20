import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Menu
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Psychology as AnalyzeIcon,
  PictureAsPdf as PublishIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { formatToKoreanDateTime, formatToKoreanDate } from '../../utils/dateUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  
  // 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [sttEditDialogOpen, setSttEditDialogOpen] = useState(false);
  const [sttConfigDialogOpen, setSttConfigDialogOpen] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    parent_name: '',
    child_name: ''
  });
  
  // 파일 업로드 상태
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDisplayName, setUploadDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // STT 관련 상태
  const [sttTranscript, setSttTranscript] = useState('');
  const [sttLoading, setSttLoading] = useState(false);
  const [originalSttContent, setOriginalSttContent] = useState(''); // 원본 STT 내용
  const [showSpeakerNamesInEdit, setShowSpeakerNamesInEdit] = useState(true); // STT 편집에서 화자명 표시 여부
  const [hasSpeakerNames, setHasSpeakerNames] = useState(false); // STT 내용에 화자명 존재 여부
  
  // STT 설정 상태
  const [sttConfig, setSttConfig] = useState({
    model_type: 'sommers',
    language: 'ko',
    language_candidates: null,
    speaker_diarization: false,
    spk_count: 2,
    profanity_filter: false,
    use_disfluency_filter: true,
    use_paragraph_splitter: true,
    paragraph_max_length: 50,
    domain: 'GENERAL',
    keywords: null
  });

  // 화자 라벨링 다이얼로그 상태
  const [speakerLabelDialogOpen, setSpeakerLabelDialogOpen] = useState(false);
  const [speakerLabels, setSpeakerLabels] = useState([]);
  const [speakerNames, setSpeakerNames] = useState({});
  const [speakerTranscript, setSpeakerTranscript] = useState('');
  const [originalSpeakerTranscript, setOriginalSpeakerTranscript] = useState('');

  // 파일명 편집 다이얼로그 상태
  const [editFileNameDialogOpen, setEditFileNameDialogOpen] = useState(false);
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);

  // 케밥 메뉴 상태
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFileForMenu, setSelectedFileForMenu] = useState(null);

  // 화자 라벨링 미리보기 업데이트 함수
  const updateSpeakerPreview = useCallback((labels, names) => {
    if (!labels || labels.length === 0) return;
    
    const updatedContentParts = [];
    for (const label of labels) {
      const speaker = label.speaker || "";
      const text = label.text || "";
      if (speaker && text) {
        // 새로운 화자 이름으로 교체
        const newSpeakerName = names[speaker] || speaker;
        updatedContentParts.push(`${newSpeakerName}: ${text}`);
      } else if (text) {
        updatedContentParts.push(text);
      }
    }
    
    setSpeakerTranscript(updatedContentParts.join("\n"));
  }, []);

  // STT 편집용 화자명 제거/추가 함수
  const removeSpeakerNamesFromSTT = useCallback((text) => {
    if (!text) return '';
    // 다양한 화자명 패턴 제거
    return text.replace(/^[가-힣a-zA-Z0-9\s\-_]+:\s*/gm, '').trim();
  }, []);

  // STT 내용에 화자명이 있는지 확인하는 함수
  const checkHasSpeakerNames = useCallback((text) => {
    if (!text) return false;
    // 화자명 패턴이 있는지 확인
    return /^[가-힣a-zA-Z0-9\s\-_]+:\s*/m.test(text);
  }, []);

  // STT 편집에서 화자명 표시 토글 함수
  const toggleSpeakerNamesInSTTEdit = useCallback((show) => {
    setShowSpeakerNamesInEdit(show);
    if (show) {
      // 화자명 표시: 원본 내용 사용
      setSttTranscript(originalSttContent);
      toast.success('화자명이 표시됩니다.');
    } else {
      // 화자명 숨김: 화자명 제거된 내용 사용
      const contentWithoutSpeakers = removeSpeakerNamesFromSTT(originalSttContent);
      setSttTranscript(contentWithoutSpeakers);
      toast.success('화자명이 숨겨집니다.');
    }
  }, [originalSttContent, removeSpeakerNamesFromSTT]);

  // 화자 이름이 변경될 때마다 미리보기 업데이트
  useEffect(() => {
    if (speakerLabels && speakerLabels.length > 0) {
      updateSpeakerPreview(speakerLabels, speakerNames);
    }
  }, [speakerNames, speakerLabels, updateSpeakerPreview]);

  useEffect(() => {
    if (id) {
      fetchReportDetail();
      fetchAnalysisStatus();
    }
  }, [id]);

  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/reports/${id}`);
      if (!response.ok) throw new Error('보고서를 불러올 수 없습니다.');
      
      const data = await response.json();
      console.log('보고서 데이터:', data);
      console.log('음성 파일들:', data.audio_files);
      
      setReport(data);
      setFormData({
        title: data.title,
        parent_name: data.parent_name || '',
        child_name: data.child_name || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}/analysis-status`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisStatus(data);
      }
    } catch (err) {
      console.error('분석 상태 조회 실패:', err);
    }
  };

  const handleUpdateReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('보고서 수정에 실패했습니다.');
      
      setEditDialogOpen(false);
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteReport = async () => {
    toast((t) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        minWidth: '280px',
        padding: '4px'
      }}>
        <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
          정말로 이 보고서를 삭제하시겠습니까?<br/>
          모든 음성 파일과 분석 결과가 삭제됩니다.<br/>
          이 작업은 되돌릴 수 없습니다.
        </span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDeleteReport();
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            삭제
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: {
        minWidth: '300px',
        padding: '16px',
      }
    });
  };

  const executeDeleteReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('보고서 삭제에 실패했습니다.');
      
      toast.success('보고서가 삭제되었습니다.');
      router.push('/reports');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAnalyzeReport = async () => {
    toast('아직 개발중입니다', {
      icon: '🚧',
      duration: 3000,
      style: {
        borderRadius: '10px',
        background: '#f59e0b',
        color: '#fff',
      }
    });
  };

  const handlePublishReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}/publish`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('보고서 발행에 실패했습니다.');
      
      toast.success('보고서 발행이 시작되었습니다.');
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('report_id', id);
      
      // display_name이 있으면 추가, 없으면 빈 문자열로 전송 (백엔드에서 filename을 기본값으로 사용)
      if (uploadDisplayName.trim()) {
        formData.append('display_name', uploadDisplayName.trim());
      }
      
      const response = await fetch(`${API_BASE_URL}/audio-files`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('파일 업로드에 실패했습니다.');
      
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDisplayName('');
      fetchReportDetail();
      toast.success('파일이 성공적으로 업로드되었습니다.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStartSTT = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/transcribe`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('STT 처리를 시작할 수 없습니다.');
      
      toast.success('STT 처리가 시작되었습니다. 잠시 후 결과를 확인해주세요.');
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleViewSTT = async (file) => {
    try {
      setSttLoading(true);
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
      setShowSpeakerNamesInEdit(true); // 기본적으로 화자명 표시 (화자명이 있는 경우에만 의미있음)
      setSelectedAudioFile(file);
      setSttEditDialogOpen(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSttLoading(false);
    }
  };

  const handleUpdateSTT = async () => {
    if (!selectedAudioFile) return;
    
    try {
      const formData = new FormData();
      
      // 현재 편집된 내용을 그대로 저장 (화자명 표시 여부와 관계없이)
      formData.append('content', sttTranscript);
      
      const response = await fetch(`${API_BASE_URL}/audio-files/${selectedAudioFile.id}/transcript`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) throw new Error('STT 결과 수정에 실패했습니다.');
      
      setSttEditDialogOpen(false);
      setSelectedAudioFile(null);
      setSttTranscript('');
      setOriginalSttContent('');
      setShowSpeakerNamesInEdit(true);
      setHasSpeakerNames(false);
      fetchReportDetail();
      toast.success('STT 결과가 수정되었습니다.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAudioFile = async (fileId, filename) => {
    toast((t) => (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        minWidth: '280px',
        padding: '4px'
      }}>
        <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
          "{filename}" 파일을 삭제하시겠습니까?
        </span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDeleteAudioFile(fileId);
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            삭제
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: {
        minWidth: '300px',
        padding: '16px',
      }
    });
  };

  const executeDeleteAudioFile = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('파일 삭제에 실패했습니다.');
      
      toast.success('파일이 삭제되었습니다.');
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenSTTConfig = async (file) => {
    try {
      setSttLoading(true);
      const response = await fetch(`${API_BASE_URL}/audio-files/${file.id}/stt-config`);
      
      if (response.ok) {
        const data = await response.json();
        setSttConfig(data);
      }
      
      setSelectedAudioFile(file);
      setSttConfigDialogOpen(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSttLoading(false);
    }
  };

  const handleSaveSTTConfig = async () => {
    if (!selectedAudioFile) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${selectedAudioFile.id}/stt-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sttConfig)
      });
      
      if (!response.ok) throw new Error('STT 설정 저장에 실패했습니다.');
      
      setSttConfigDialogOpen(false);
      toast.success('STT 설정이 저장되었습니다.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRestartSTT = async () => {
    if (!selectedAudioFile) return;
    
    try {
      // STT 설정 저장
      await handleSaveSTTConfig();
      
      // STT 재시작 (새로운 API 사용)
      const response = await fetch(`${API_BASE_URL}/audio-files/${selectedAudioFile.id}/transcribe/restart`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('STT 재시작에 실패했습니다.');
      
      setSttConfigDialogOpen(false);
      toast.success('STT 처리가 새로운 설정으로 재시작되었습니다.');
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenSpeakerLabels = async (file) => {
    try {
      setSttLoading(true);
      const response = await fetch(`${API_BASE_URL}/audio-files/${file.id}/transcript/speakers`);
      
      if (!response.ok) throw new Error('화자 정보를 불러올 수 없습니다.');
      
      const data = await response.json();
      setSpeakerLabels(data.speaker_labels || []);
      setSpeakerNames(data.speaker_names || {});
      setOriginalSpeakerTranscript(data.transcript_content || '');
      setSpeakerTranscript(data.transcript_content || '');
      setSelectedAudioFile(file);
      setSpeakerLabelDialogOpen(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSttLoading(false);
    }
  };

  const handleUpdateSpeakerLabels = async () => {
    if (!selectedAudioFile) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${selectedAudioFile.id}/transcript/speakers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(speakerNames)
      });
      
      if (!response.ok) throw new Error('화자 라벨링 업데이트에 실패했습니다.');
      
      handleCloseSpeakerLabelDialog();
      toast.success('화자 라벨링이 업데이트되었습니다.');
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 화자 라벨링 다이얼로그 닫기 함수
  const handleCloseSpeakerLabelDialog = () => {
    setSpeakerLabelDialogOpen(false);
    setSelectedAudioFile(null);
    setSpeakerLabels([]);
    setSpeakerNames({});
    setSpeakerTranscript('');
    setOriginalSpeakerTranscript('');
  };

  const handleCloseSTTEditDialog = () => {
    setSttEditDialogOpen(false);
    setSelectedAudioFile(null);
    setSttTranscript('');
    setOriginalSttContent('');
    setShowSpeakerNamesInEdit(true);
    setHasSpeakerNames(false);
  };

  // 파일명 편집 함수들
  const handleOpenEditFileName = (file) => {
    setEditingFileId(file.id);
    setEditingFileName(file.display_name || file.filename);
    setEditFileNameDialogOpen(true);
  };

  const handleUpdateFileName = async () => {
    if (!editingFileId || !editingFileName.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${editingFileId}/display-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: editingFileName.trim() })
      });
      
      if (!response.ok) throw new Error('파일명 업데이트에 실패했습니다.');
      
      setEditFileNameDialogOpen(false);
      setEditingFileName('');
      setEditingFileId(null);
      toast.success('파일명이 업데이트되었습니다.');
      fetchReportDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCloseEditFileNameDialog = () => {
    setEditFileNameDialogOpen(false);
    setEditingFileName('');
    setEditingFileId(null);
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

  const handleMenuAction = (action) => {
    if (!selectedFileForMenu) return;
    
    switch (action) {
      case 'download':
        window.open(`${API_BASE_URL}/audio-files/${selectedFileForMenu.id}/download`, '_blank');
        break;
      case 'editName':
        handleOpenEditFileName(selectedFileForMenu);
        break;
      case 'delete':
        handleDeleteAudioFile(selectedFileForMenu.id, selectedFileForMenu.filename);
        break;
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      analyzing: 'warning',
      completed: 'info',
      published: 'success'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: '초안',
      analyzing: '분석중',
      completed: '완료',
      published: '발행됨'
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

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

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/reports"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          목록으로
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {report.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEditDialogOpen(true)}
          >
            수정
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAnalyzeReport}
            disabled={report.status === 'analyzing'}
          >
            AI 분석
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handlePublishReport}
            disabled={report.status !== 'completed'}
          >
            발행
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleDeleteReport}
            disabled={report.status === 'published'}
          >
            삭제
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 기본 정보 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  상태
                </Typography>
                <Chip
                  label={getStatusText(report.status)}
                  color={getStatusColor(report.status)}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  부모 이름
                </Typography>
                <Typography variant="body1">
                  {report.parent_name || '미지정'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  아이 이름
                </Typography>
                <Typography variant="body1">
                  {report.child_name || '미지정'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  생성일
                </Typography>
                <Typography variant="body1">
                  {formatToKoreanDateTime(report.created_at)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  수정일
                </Typography>
                <Typography variant="body1">
                  {formatToKoreanDateTime(report.updated_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 음성 파일 목록 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  음성 파일 ({report.audio_files?.length || 0}개)
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  파일 업로드
                </Button>
              </Box>
              
              {report.audio_files && report.audio_files.length > 0 ? (
                <List>
                  {report.audio_files.map((file, index) => (
                    <Box key={file.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Chip
                                label={`STT: ${getSTTStatusText(file.stt_status)}`}
                                color={getSTTStatusColor(file.stt_status)}
                                size="small"
                              />
                              
                              {/* STT 관련 주요 버튼들 */}
                              <Button
                                onClick={() => handleOpenSTTConfig(file)}
                                size="small"
                                variant="outlined"
                                sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                              >
                                STT 설정
                              </Button>
                              
                              {file.stt_status === 'completed' && (
                                <>
                                  <Button
                                    onClick={() => handleOpenSpeakerLabels(file)}
                                    size="small"
                                    variant="outlined"
                                    sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                                  >
                                    화자 라벨링
                                  </Button>
                                  <Button
                                    onClick={() => handleViewSTT(file)}
                                    size="small"
                                    variant="outlined"
                                    sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                                  >
                                    STT 결과 편집
                                  </Button>
                                </>
                              )}
                              
                              {file.stt_status === 'pending' && (
                                <Button
                                  onClick={() => handleStartSTT(file.id)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                                >
                                  STT 시작
                                </Button>
                              )}
                              
                              {file.stt_status === 'failed' && (
                                <Button
                                  onClick={() => handleStartSTT(file.id)}
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                                >
                                  STT 재시도
                                </Button>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            onClick={(event) => handleMenuClick(event, file)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < report.audio_files.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  업로드된 음성 파일이 없습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI 분석 결과 */}
        {report.report_data && report.report_data.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI 분석 결과
                </Typography>
                {report.report_data.map((data, index) => (
                  <Accordion key={data.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        분석 결과 #{index + 1} - {formatToKoreanDateTime(data.generated_at)}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                        {JSON.stringify(data.analysis_data, null, 2)}
                      </pre>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 발행된 보고서 */}
        {report.published_reports && report.published_reports.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  발행된 보고서
                </Typography>
                <List>
                  {report.published_reports.map((published) => (
                    <ListItem key={published.id}>
                      <ListItemText
                        primary={`발행일: ${new Date(published.published_at).toLocaleDateString()}`}
                        secondary={`Canva ID: ${published.canva_design_id || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
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

      {/* 파일 업로드 다이얼로그 */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>음성 파일 업로드</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              업로드할 음성 파일을 선택하세요.
            </Typography>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                setUploadFile(e.target.files[0]);
                // 파일이 선택되면 기본값으로 파일명 설정
                if (e.target.files[0] && !uploadDisplayName) {
                  setUploadDisplayName(e.target.files[0].name);
                }
              }}
              style={{ marginTop: '16px', marginBottom: '16px' }}
            />
            
            <TextField
              fullWidth
              label="파일명 (선택사항)"
              value={uploadDisplayName}
              onChange={(e) => setUploadDisplayName(e.target.value)}
              placeholder="파일명을 입력하세요. 비워두면 원본 파일명이 사용됩니다."
              helperText="사용자가 보기 편한 이름으로 설정할 수 있습니다."
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setUploadFile(null);
            setUploadDisplayName('');
          }}>
            취소
          </Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained"
            disabled={!uploadFile || uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 파일명 편집 다이얼로그 */}
      <Dialog open={editFileNameDialogOpen} onClose={handleCloseEditFileNameDialog} maxWidth="sm" fullWidth>
        <DialogTitle>파일명 편집</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              파일의 표시명을 변경할 수 있습니다.
            </Typography>
            <TextField
              fullWidth
              label="파일명"
              value={editingFileName}
              onChange={(e) => setEditingFileName(e.target.value)}
              placeholder="새로운 파일명을 입력하세요"
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditFileNameDialog}>취소</Button>
          <Button 
            onClick={handleUpdateFileName} 
            variant="contained"
            disabled={!editingFileName.trim()}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* STT 편집 다이얼로그 */}
      <Dialog open={sttEditDialogOpen} onClose={handleCloseSTTEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            STT 결과 편집 - {selectedAudioFile?.filename}
            {hasSpeakerNames && (
              <FormControlLabel
                control={
                  <Switch
                    checked={showSpeakerNamesInEdit}
                    onChange={(e) => toggleSpeakerNamesInSTTEdit(e.target.checked)}
                    color="primary"
                  />
                }
                label="화자명 표시"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {sttLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                STT 결과를 확인하고 필요에 따라 수정하세요. 수정된 내용은 AI 분석에 사용됩니다.
              </Typography>
              {hasSpeakerNames && !showSpeakerNamesInEdit && (
                <Box sx={{ 
                  mb: 2, 
                  p: 1.5, 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: 1, 
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
                  borderRadius: 1, 
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
                onChange={(e) => setSttTranscript(e.target.value)}
                margin="normal"
                multiline
                rows={15}
                placeholder="STT 결과가 여기에 표시됩니다..."
                sx={{ 
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: 1.5
                  }
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
        <DialogActions>
          <Button onClick={handleCloseSTTEditDialog}>취소</Button>
          <Button 
            onClick={handleUpdateSTT} 
            variant="contained"
            disabled={sttLoading}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* STT 설정 다이얼로그 */}
      <Dialog open={sttConfigDialogOpen} onClose={() => setSttConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          STT 설정 - {selectedAudioFile?.filename}
        </DialogTitle>
        <DialogContent>
          {sttLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* 모델 설정 */}
              <Typography variant="h6" gutterBottom>모델 설정</Typography>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>모델 타입</InputLabel>
                  <Select
                    value={sttConfig.model_type}
                    label="모델 타입"
                    onChange={(e) => setSttConfig({ ...sttConfig, model_type: e.target.value })}
                  >
                    <MenuItem value="sommers">Sommers (리턴제로 기본)</MenuItem>
                    <MenuItem value="whisper">Whisper</MenuItem>
                  </Select>
                </FormControl>
                
                {sttConfig.model_type === 'whisper' && (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>언어</InputLabel>
                      <Select
                        value={sttConfig.language}
                        label="언어"
                        onChange={(e) => setSttConfig({ ...sttConfig, language: e.target.value })}
                      >
                        <MenuItem value="ko">한국어</MenuItem>
                        <MenuItem value="en">영어</MenuItem>
                        <MenuItem value="ja">일본어</MenuItem>
                        <MenuItem value="zh">중국어</MenuItem>
                        <MenuItem value="detect">자동 감지</MenuItem>
                        <MenuItem value="multi">다중 언어</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {(sttConfig.language === 'detect' || sttConfig.language === 'multi') && (
                      <TextField
                        fullWidth
                        label="언어 감지 후보군 (쉼표로 구분)"
                        value={sttConfig.language_candidates ? sttConfig.language_candidates.join(', ') : ''}
                        onChange={(e) => setSttConfig({
                          ...sttConfig,
                          language_candidates: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang)
                        })}
                        placeholder="ko, en, ja, zh"
                        helperText="감지할 언어들을 쉼표로 구분하여 입력하세요"
                      />
                    )}
                  </>
                )}
              </Box>

              {/* 화자 분리 설정 */}
              <Typography variant="h6" gutterBottom>화자 분리 설정</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={sttConfig.speaker_diarization}
                    onChange={(e) => setSttConfig({ ...sttConfig, speaker_diarization: e.target.checked })}
                  />
                }
                label="화자 분리 사용"
                sx={{ mb: 2 }}
              />
              
              {sttConfig.speaker_diarization && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    화자 수 설정
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>화자 수</InputLabel>
                    <Select
                      value={sttConfig.spk_count}
                      label="화자 수"
                      onChange={(e) => setSttConfig({ ...sttConfig, spk_count: parseInt(e.target.value) })}
                    >
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={4}>4</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* 필터 설정 */}
              <Typography variant="h6" gutterBottom>필터 설정</Typography>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sttConfig.profanity_filter}
                      onChange={(e) => setSttConfig({ ...sttConfig, profanity_filter: e.target.checked })}
                    />
                  }
                  label="비속어 필터"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={sttConfig.use_disfluency_filter}
                      onChange={(e) => setSttConfig({ ...sttConfig, use_disfluency_filter: e.target.checked })}
                    />
                  }
                  label="간투어 필터"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={sttConfig.use_paragraph_splitter}
                      onChange={(e) => setSttConfig({ ...sttConfig, use_paragraph_splitter: e.target.checked })}
                    />
                  }
                  label="문단 나누기"
                  sx={{ mb: 1 }}
                />
                {sttConfig.use_paragraph_splitter && (
                  <TextField
                    fullWidth
                    label="문단 최대 길이"
                    type="number"
                    value={sttConfig.paragraph_max_length}
                    onChange={(e) => setSttConfig({ ...sttConfig, paragraph_max_length: parseInt(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              {/* 고급 설정 */}
              <Typography variant="h6" gutterBottom>고급 설정</Typography>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>도메인</InputLabel>
                  <Select
                    value={sttConfig.domain}
                    label="도메인"
                    onChange={(e) => setSttConfig({ ...sttConfig, domain: e.target.value })}
                  >
                    <MenuItem value="GENERAL">일반</MenuItem>
                    <MenuItem value="CALL">통화</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="키워드 부스팅 (쉼표로 구분)"
                  value={sttConfig.keywords ? sttConfig.keywords.join(', ') : ''}
                  onChange={(e) => setSttConfig({
                    ...sttConfig,
                    keywords: e.target.value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)
                  })}
                  placeholder="키워드1, 키워드2, 키워드3"
                  helperText="인식 정확도를 높일 키워드들을 쉼표로 구분하여 입력하세요"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSttConfigDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveSTTConfig} variant="outlined">
            설정 저장
          </Button>
          <Button onClick={handleRestartSTT} variant="contained">
            설정 저장 후 STT 재시작
          </Button>
        </DialogActions>
      </Dialog>

      {/* 화자 라벨링 다이얼로그 */}
      <Dialog open={speakerLabelDialogOpen} onClose={handleCloseSpeakerLabelDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          화자 라벨링 - {selectedAudioFile?.filename}
        </DialogTitle>
        <DialogContent>
          {sttLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {speakerLabels && speakerLabels.length > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>화자 이름 설정</Typography>
                  <Box sx={{ mb: 3 }}>
                    {Object.keys(speakerNames).map((speakerKey) => (
                      <TextField
                        key={speakerKey}
                        label={`${speakerKey} 이름`}
                        value={speakerNames[speakerKey] || ''}
                        onChange={(e) => setSpeakerNames({
                          ...speakerNames,
                          [speakerKey]: e.target.value
                        })}
                        size="small"
                        sx={{ mr: 2, mb: 2, minWidth: 150 }}
                        placeholder={`예: ${speakerKey === 'speaker0' ? '부모' : speakerKey === 'speaker1' ? '아이' : '화자'}`}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>미리보기</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      화자 이름을 입력하면 아래 미리보기가 실시간으로 업데이트됩니다.
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* 원본 텍스트 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom color="text.secondary">
                        원본 화자 라벨링
                      </Typography>
                      <TextField
                        fullWidth
                        label="원본 화자 라벨링"
                        value={originalSpeakerTranscript}
                        margin="normal"
                        multiline
                        rows={12}
                        InputProps={{ readOnly: true }}
                        sx={{ 
                          '& .MuiInputBase-root': { 
                            backgroundColor: '#f5f5f5',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </Box>
                    
                    {/* 변경된 텍스트 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        변경된 텍스트 (미리보기)
                      </Typography>
                      <TextField
                        fullWidth
                        label="변경된 화자 라벨링"
                        value={speakerTranscript}
                        margin="normal"
                        multiline
                        rows={12}
                        InputProps={{ readOnly: true }}
                        sx={{ 
                          '& .MuiInputBase-root': { 
                            backgroundColor: '#e8f5e8',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  
                  {/* 변경 사항 표시 */}
                  {originalSpeakerTranscript !== speakerTranscript && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
                      <Typography variant="body2" color="warning.dark">
                        💡 화자 이름이 변경되어 텍스트가 업데이트되었습니다. 저장 버튼을 클릭하여 변경사항을 적용하세요.
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">
                  화자 분리가 적용되지 않았거나 화자 정보가 없습니다.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSpeakerLabelDialog}>취소</Button>
          <Button 
            onClick={handleUpdateSpeakerLabels} 
            variant="contained"
            disabled={sttLoading || !speakerLabels || speakerLabels.length === 0}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 보고서 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>보고서 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="보고서 제목"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="부모 이름"
              value={formData.parent_name}
              onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="아이 이름"
              value={formData.child_name}
              onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handleUpdateReport} 
            variant="contained"
            disabled={!formData.title.trim()}
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}