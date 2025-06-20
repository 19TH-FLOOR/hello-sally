import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useReportActions = (reportId, fetchReportDetail, startSTTPolling) => {
  const router = useRouter();

  // 보고서 수정
  const updateReport = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('보고서 수정에 실패했습니다.');
      
      toast.success('보고서가 수정되었습니다.');
      await fetchReportDetail();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // 보고서 삭제
  const deleteReport = async () => {
    return new Promise((resolve) => {
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
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              취소
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
                    method: 'DELETE'
                  });
                  
                  if (!response.ok) throw new Error('보고서 삭제에 실패했습니다.');
                  
                  toast.success('보고서가 삭제되었습니다.');
                  router.push('/reports');
                  resolve(true);
                } catch (err) {
                  toast.error(err.message);
                  resolve(false);
                }
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              삭제
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        style: { minWidth: '300px', padding: '16px' }
      });
    });
  };

  // 보고서 분석
  const analyzeReport = async () => {
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

  // 보고서 발행
  const publishReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/publish`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('보고서 발행에 실패했습니다.');
      
      toast.success('보고서 발행이 시작되었습니다.');
      await fetchReportDetail();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // 파일 업로드
  const uploadFile = async (file, displayName) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('report_id', reportId);
      
      if (displayName && displayName.trim()) {
        formData.append('display_name', displayName.trim());
      }
      
      const response = await fetch(`${API_BASE_URL}/audio-files`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('파일 업로드에 실패했습니다.');
      
      toast.success('파일이 성공적으로 업로드되었습니다.');
      await fetchReportDetail();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // STT 시작
  const startSTT = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/transcribe`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('STT 처리를 시작할 수 없습니다.');
      
      toast.success('STT 처리가 시작되었습니다. 자동으로 상태를 확인합니다.');
      await fetchReportDetail();
      startSTTPolling();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // STT 결과 수정
  const updateSTT = async (fileId, content) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/transcript`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) throw new Error('STT 결과 수정에 실패했습니다.');
      
      toast.success('STT 결과가 수정되었습니다.');
      await fetchReportDetail();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // STT 설정 저장
  const saveSTTConfig = async (fileId, config) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/stt-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) throw new Error('STT 설정 저장에 실패했습니다.');
      
      toast.success('STT 설정이 저장되었습니다.');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // STT 재시작
  const restartSTT = async (fileId, config) => {
    try {
      // STT 설정 저장
      const configSaved = await saveSTTConfig(fileId, config);
      if (!configSaved) return false;
      
      // STT 재시작
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/transcribe/restart`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('STT 재시작에 실패했습니다.');
      
      toast.success('STT 처리가 새로운 설정으로 재시작되었습니다.');
      await fetchReportDetail();
      startSTTPolling();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // 화자 라벨링 업데이트
  const updateSpeakerLabels = async (fileId, speakerNames) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/transcript/speakers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(speakerNames)
      });
      
      if (!response.ok) throw new Error('화자 라벨링 업데이트에 실패했습니다.');
      
      toast.success('화자 라벨링이 업데이트되었습니다.');
      await fetchReportDetail();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // 파일명 업데이트
  const updateFileName = async (fileId, displayName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/display-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim() })
      });
      
      if (!response.ok) throw new Error('파일명 업데이트에 실패했습니다.');
      
      toast.success('파일명이 업데이트되었습니다.');
      await fetchReportDetail();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // 파일 삭제
  const deleteAudioFile = async (fileId, filename) => {
    return new Promise((resolve) => {
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
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              취소
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}`, {
                    method: 'DELETE'
                  });
                  
                  if (!response.ok) throw new Error('파일 삭제에 실패했습니다.');
                  
                  toast.success('파일이 삭제되었습니다.');
                  await fetchReportDetail();
                  resolve(true);
                } catch (err) {
                  toast.error(err.message);
                  resolve(false);
                }
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              삭제
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        style: { minWidth: '300px', padding: '16px' }
      });
    });
  };

  return {
    updateReport,
    deleteReport,
    analyzeReport,
    publishReport,
    uploadFile,
    startSTT,
    updateSTT,
    saveSTTConfig,
    restartSTT,
    updateSpeakerLabels,
    updateFileName,
    deleteAudioFile
  };
}; 